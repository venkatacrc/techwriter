import AppKit
import SwiftUI
import WebKit

/// Holds the page's web view so the Print command can reach it.
@MainActor
final class PageWeb: ObservableObject {
    weak var webView: WKWebView?

    var canPrint: Bool { webView?.window != nil }

    func print(title: String) {
        guard let webView, let window = webView.window else {
            NSSound.beep()
            return
        }
        let info = NSPrintInfo.shared.copy() as! NSPrintInfo
        info.topMargin = 40
        info.bottomMargin = 40
        info.leftMargin = 44
        info.rightMargin = 44
        info.horizontalPagination = .fit
        info.verticalPagination = .automatic
        info.isVerticallyCentered = false
        let op = webView.printOperation(with: info)
        op.jobTitle = title
        op.showsPrintPanel = true
        op.showsProgressPanel = true
        op.view?.frame = webView.bounds
        op.runModal(for: window, delegate: nil, didRun: nil, contextInfo: nil)
    }
}

/// Renders one page of the program. Links to `#id` open that page in the app; web links open in the browser.
struct HTMLView: NSViewRepresentable {
    let item: Item
    let onLink: (String) -> Void
    var web: PageWeb?

    static let base = URL(string: "https://techwriter.local/")!

    func makeCoordinator() -> Coordinator { Coordinator(onLink: onLink) }

    func makeNSView(context: Context) -> WKWebView {
        let view = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
        view.navigationDelegate = context.coordinator
        view.setValue(false, forKey: "drawsBackground")
        view.allowsMagnification = true
        return view
    }

    func updateNSView(_ view: WKWebView, context: Context) {
        context.coordinator.onLink = onLink
        web?.webView = view
        let page = Self.document(item)
        if context.coordinator.loaded != page {
            context.coordinator.loaded = page
            view.loadHTMLString(page, baseURL: Self.base)
        }
    }

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate {
        var onLink: (String) -> Void
        var loaded = ""

        init(onLink: @escaping (String) -> Void) {
            self.onLink = onLink
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
            guard navigationAction.navigationType == .linkActivated, let url = navigationAction.request.url else {
                return .allow
            }
            if url.host == HTMLView.base.host {
                if let id = url.fragment, !id.isEmpty {
                    onLink(id.removingPercentEncoding ?? id)
                }
            } else {
                NSWorkspace.shared.open(url)
            }
            return .cancel
        }
    }

    static func document(_ item: Item) -> String {
        var meta: [String] = []
        if item.isDrill {
            meta = ["\(item.minutes) min", item.skill, "weeks " + item.weeks.map(String.init).joined(separator: ", ")]
        }
        let kicker = item.kicker.isEmpty ? "" : "<p class=\"kicker\">\(escape(item.kicker))</p>"
        let metaLine = meta.isEmpty ? "" : "<p class=\"meta\">\(escape(meta.joined(separator: " · ")))</p>"
        return """
        <!doctype html>
        <html><head><meta charset="utf-8"><title>\(escape(item.title))</title><style>\(css)</style></head>
        <body><article>\(kicker)<h1>\(escape(item.title))</h1>\(metaLine)<div class="prose">\(item.html)</div></article></body></html>
        """
    }

    private static func escape(_ s: String) -> String {
        s.replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
    }

    /// The prose part of web/app.css.
    private static let css = """
    :root { --accent: #2f55c9; --text: #1f1a16; --muted: #7a7068; --line: #e4ddd4; --soft: #f6f2ec;
            --code-bg: #1f1a16; --code-ink: #f6f2ec; color-scheme: light dark; }
    @media (prefers-color-scheme: dark) {
        :root { --accent: #7ea2ff; --text: #f2ece5; --muted: #a79d93; --line: #3a332c; --soft: #2b261f; --code-bg: #0f0d0b; }
    }
    html, body { margin: 0; background: transparent; color: var(--text); }
    body { font: 16px/1.6 "Iowan Old Style", Palatino, Georgia, serif; -webkit-font-smoothing: antialiased; }
    article { max-width: 720px; margin: 0 auto; padding: 26px 30px 40px; }
    a { color: var(--accent); }
    .kicker { margin: 0 0 6px; font: 700 12px/1.3 -apple-system, system-ui, sans-serif; letter-spacing: 0.05em;
              text-transform: uppercase; color: var(--accent); }
    h1 { margin: 0 0 6px; font-size: 30px; line-height: 1.15; font-weight: 650; }
    .meta { margin: 0 0 14px; color: var(--muted); font: 14px -apple-system, system-ui, sans-serif; }
    .prose { font-size: 17px; overflow-wrap: break-word; }
    .prose h2 { margin: 1.5em 0 0.4em; font: 650 21px/1.25 -apple-system, system-ui, sans-serif; }
    .prose h3 { margin: 1.3em 0 0.3em; font: 650 18px/1.3 -apple-system, system-ui, sans-serif; }
    .prose ul, .prose ol { padding-left: 1.3em; }
    .prose li { margin: 0.25em 0; }
    .prose hr { border: 0; border-top: 1px solid var(--line); margin: 1.5em 0; }
    .prose blockquote { margin: 1em 0; padding: 2px 0 2px 14px; border-left: 3px solid var(--accent); color: var(--muted); }
    .prose .note { margin: 0.8em 0; padding: 8px 12px; border-radius: 10px; background: var(--soft); color: var(--muted);
                   font: 14px/1.45 -apple-system, system-ui, sans-serif; }
    code { font: 0.86em ui-monospace, SFMono-Regular, Menlo, monospace; }
    :not(pre) > code { background: var(--soft); padding: 0.1em 0.35em; border-radius: 5px; }
    pre { margin: 1em 0; padding: 14px 16px; border-radius: 12px; background: var(--code-bg); color: var(--code-ink);
          overflow-x: auto; line-height: 1.45; font-size: 14px; }
    .table-wrap { margin: 12px 0 16px; overflow-x: auto; }
    table { border-collapse: collapse; min-width: 100%; font: 14px/1.4 -apple-system, system-ui, sans-serif; }
    th, td { padding: 7px 9px; border: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { background: var(--soft); }
    .math { font-family: "STIX Two Math", "Cambria Math", serif; font-style: italic; }
    .math .mr { font-style: normal; }
    .math .ovl { text-decoration: overline; }
    .math sup, .math sub { font-size: 0.72em; }
    .math.display { display: block; margin: 0.7em 0; overflow-x: auto; text-align: center; font-size: 1.1em; }
    .math .frac { display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center;
                  font-size: 0.86em; line-height: 1.15; margin: 0 0.12em; }
    .math .frac .den { border-top: 1px solid currentColor; }
    @media print {
        :root { --text: #000; --muted: #444; --soft: #f3f3f3; --code-bg: #f6f6f6; --code-ink: #000; }
        article { max-width: none; padding: 0; }
        pre { white-space: pre-wrap; border: 1px solid #ccc; }
        a { color: #000; text-decoration: none; }
    }
    """
}
