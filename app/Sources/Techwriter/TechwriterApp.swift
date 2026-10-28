import AppKit
import SwiftUI

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

@main
struct TechwriterApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var store = ProgramStore()
    @StateObject private var progress = ProgressStore()
    @StateObject private var timer = DrillTimer()
    @StateObject private var navigator = Navigator()
    @StateObject private var web = PageWeb()

    private var current: Item? { navigator.current(in: store) }

    var body: some Scene {
        WindowGroup("Techwriter") {
            ContentView()
                .environmentObject(store)
                .environmentObject(progress)
                .environmentObject(timer)
                .environmentObject(navigator)
                .environmentObject(web)
                .frame(minWidth: 980, minHeight: 660)
        }
        .commands {
            CommandGroup(replacing: .printItem) {
                Button("Print Page / Save as PDF…") { web.print(title: current?.title ?? "Techwriter") }
                    .keyboardShortcut("p")
                    .disabled(current == nil)
            }
            CommandGroup(after: .newItem) {
                Button("Export Notes…") { progress.exportNotes() }
                    .keyboardShortcut("e", modifiers: [.command, .shift])
                Button("Import Notes…") { progress.importNotes() }
                    .keyboardShortcut("i", modifiers: [.command, .shift])
                Divider()
                Button("Reset Progress…") { progress.reset() }
            }
            CommandMenu("Go") {
                ForEach(Array(Shelf.allCases.enumerated()), id: \.element) { index, shelf in
                    Button(shelf.title) { navigator.show(shelf, in: store) }
                        .keyboardShortcut(KeyEquivalent(Character(String(index + 1))))
                }
                Divider()
                Button("Previous Page") { navigator.step(-1, in: store) }
                    .keyboardShortcut("[")
                Button("Next Page") { navigator.step(1, in: store) }
                    .keyboardShortcut("]")
                Divider()
                Button("Start or Stop Timer") { if let item = current, item.isDrill { timer.toggle(item) } }
                    .keyboardShortcut("t")
                    .disabled(!(current?.isDrill ?? false))
                Button("Mark Done") { if let item = current, item.hasPad { progress.toggleDone(item.id) } }
                    .keyboardShortcut("d")
                    .disabled(!(current?.hasPad ?? false))
            }
        }
    }
}
