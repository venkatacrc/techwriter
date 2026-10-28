import SwiftUI

/// One page of the program. Drills and weekly pieces get a writing pane beside the prompt.
struct PageView: View {
    let item: Item
    let open: (String) -> Void
    @EnvironmentObject private var store: ProgramStore
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var timer: DrillTimer
    @EnvironmentObject private var navigator: Navigator
    @EnvironmentObject private var web: PageWeb

    var body: some View {
        VStack(spacing: 16) {
            header
            if item.hasPad {
                HSplitView {
                    page.frame(minWidth: 340, idealWidth: 520)
                    WritingPane(item: item)
                        .id(item.id)
                        .frame(minWidth: 320, idealWidth: 460)
                        .padding(.leading, 14)
                }
            } else {
                page
            }
            controls
        }
    }

    private var page: some View {
        HTMLView(item: item, onLink: open, web: web)
            .background(Color(nsColor: .textBackgroundColor))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(Color(nsColor: .separatorColor)))
            .shadow(color: .black.opacity(0.06), radius: 10, y: 4)
    }

    private var header: some View {
        HStack {
            Text(headline).font(.headline)
            Spacer()
            Text(status).font(.callout).foregroundStyle(.secondary)
        }
    }

    private var headline: String {
        if item.isDrill { return "\(item.short) · \(item.minutes) min · \(item.skill)" }
        if !item.drills.isEmpty { return "\(item.kicker) · drills \(item.drills.joined(separator: ", "))" }
        return item.section.isEmpty ? item.kicker : item.section
    }

    private var status: String {
        if item.isDrill {
            return progress.isDone(item.id) ? "Done" : "\(progress.doneCount(store.drills.map(\.id))) of \(store.drills.count) drills done"
        }
        if !item.drills.isEmpty {
            return "\(progress.doneCount(item.drills)) of \(item.drills.count) drills done"
        }
        let list = store.items(in: item.shelf)
        let index = (list.firstIndex { $0.id == item.id } ?? 0) + 1
        return "\(index) of \(list.count)"
    }

    private var controls: some View {
        HStack(spacing: 12) {
            Button { navigator.step(-1, in: store) } label: { Label("Previous", systemImage: "chevron.left") }
                .disabled(!navigator.canStep(-1, in: store))
                .help("Previous page (⌘[)")
            Button { navigator.step(1, in: store) } label: { Label("Next", systemImage: "chevron.right") }
                .disabled(!navigator.canStep(1, in: store))
                .help("Next page (⌘])")
            Spacer()
            if item.isDrill {
                TimelineView(.periodic(from: .now, by: 0.5)) { context in
                    let running = timer.isRunning(item.id)
                    Button { timer.toggle(item) } label: {
                        Label(timer.label(for: item, now: context.date), systemImage: running ? "stop.circle" : "timer")
                            .monospacedDigit()
                    }
                    .tint(running ? .orange : nil)
                    .help(running ? "Stop the timer (⌘T)" : "Start a \(item.minutes)-minute timer (⌘T)")
                }
            }
            if item.hasPad {
                let done = progress.isDone(item.id)
                Button { progress.toggleDone(item.id) } label: {
                    Label(done ? "Done" : (item.isDrill ? "Mark done" : "Piece done"),
                          systemImage: done ? "checkmark.circle.fill" : "checkmark.circle")
                }
                .buttonStyle(.borderedProminent)
                .tint(done ? .green : .accentColor)
                .help("Mark done (⌘D)")
            }
        }
        .controlSize(.large)
    }
}

struct WritingPane: View {
    let item: Item
    @EnvironmentObject private var progress: ProgressStore
    @StateObject private var draft = Draft("")

    private var words: Int {
        draft.value.split(whereSeparator: { $0.isWhitespace || $0.isNewline }).count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if !item.done.isEmpty {
                label("Done when")
                VStack(alignment: .leading, spacing: 7) {
                    ForEach(Array(item.done.enumerated()), id: \.offset) { index, line in
                        Toggle(isOn: Binding(
                            get: { progress.check(item.id, index) },
                            set: { progress.setCheck($0, index, for: item.id) })
                        ) {
                            Text(line).fixedSize(horizontal: false, vertical: true)
                        }
                        .toggleStyle(.checkbox)
                    }
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Color.primary.opacity(0.05)))
            }
            label(item.pad == "draft" ? "Draft the piece" : "Your attempt")
            TextEditor(text: $draft.value)
                .font(.system(size: 15, design: .serif))
                .lineSpacing(3)
                .scrollContentBackground(.hidden)
                .padding(10)
                .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(Color(nsColor: .textBackgroundColor)))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(Color(nsColor: .separatorColor)))
                .onChange(of: draft.value) { progress.setNote(draft.value, for: item.id) }
            HStack {
                Text(item.pad == "draft" ? "Edit in a later session, after a cool-off." : "Start the timer, then write without editing.")
                Spacer()
                Text("\(words) words").monospacedDigit()
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .onAppear { draft.value = progress.note(item.id) }
    }

    private func label(_ s: String) -> some View {
        Text(s.uppercased())
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
    }
}
