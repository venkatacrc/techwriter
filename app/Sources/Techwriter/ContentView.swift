import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: ProgramStore
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var timer: DrillTimer
    @EnvironmentObject private var navigator: Navigator

    private var current: Item? { navigator.current(in: store) }
    private var shelf: Shelf { navigator.shelf(in: store) }

    private var shelfBinding: Binding<Shelf> {
        Binding(get: { shelf }, set: { navigator.show($0, in: store) })
    }

    var body: some View {
        NavigationSplitView {
            SidebarView(shelf: shelf, query: navigator.query, selection: $navigator.selection)
                .navigationSplitViewColumnWidth(min: 250, ideal: 300)
        } detail: {
            detail
                .padding(24)
                .toolbar { toolbar }
                .navigationTitle(current?.title ?? "Today")
        }
        .searchable(text: $navigator.query, placement: .sidebar, prompt: "Search every page")
        .alert("Time is up", isPresented: Binding(
            get: { timer.finished != nil },
            set: { if !$0 { timer.finished = nil } })
        ) {
            Button("OK") { timer.finished = nil }
        } message: {
            Text("Stop writing. Check your attempt against “Done when”, then mark the drill done.")
        }
        .alert("Something went wrong", isPresented: Binding(
            get: { store.errorMessage != nil || progress.errorMessage != nil },
            set: { if !$0 { store.errorMessage = nil; progress.errorMessage = nil } })
        ) {
            Button("OK") { store.errorMessage = nil; progress.errorMessage = nil }
        } message: {
            Text(store.errorMessage ?? progress.errorMessage ?? "")
        }
    }

    @ViewBuilder
    private var detail: some View {
        if let item = current {
            PageView(item: item, open: open)
        } else {
            TodayView(open: open)
        }
    }

    private func open(_ id: String) {
        navigator.query = ""
        navigator.open(id, in: store)
    }

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .navigation) {
            Picker("View", selection: shelfBinding) {
                ForEach(Shelf.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            .help("Today, Weeks, Drills, Library (⌘1 to ⌘4)")
        }
    }
}
