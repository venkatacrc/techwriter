import SwiftUI

struct SidebarView: View {
    let shelf: Shelf
    let query: String
    @Binding var selection: String?
    @EnvironmentObject private var store: ProgramStore
    @EnvironmentObject private var progress: ProgressStore
    /// Newline-separated week names whose drills are folded away.
    @AppStorage("collapsedWeeks") private var collapsedRaw = ""

    private var collapsed: Set<String> {
        Set(collapsedRaw.split(separator: "\n").map(String.init))
    }

    var body: some View {
        List(selection: $selection) {
            if !query.trimmingCharacters(in: .whitespaces).isEmpty {
                let hits = store.search(query)
                Section(hits.count == 1 ? "1 page" : "\(hits.count) pages") {
                    ForEach(hits) { item in
                        row(item, detail: item.isDrill ? item.section : item.kicker)
                    }
                }
            } else {
                Section {
                    Label("Today", systemImage: "sun.max")
                        .tag("today")
                }
                switch shelf {
                case .drills:
                    ForEach(store.sections(store.drills)) { section in
                        Section(isExpanded: expanded(section.name)) {
                            ForEach(section.items) { item in
                                row(item, detail: "\(item.minutes) min · \(item.skill)")
                            }
                        } header: {
                            HStack {
                                Text(section.name)
                                Spacer()
                                Text("\(progress.doneCount(section.items.map(\.id)))/\(section.items.count)")
                                    .monospacedDigit()
                            }
                        }
                    }
                case .today, .weeks:
                    ForEach(store.sections(store.items(in: .weeks))) { section in
                        Section(section.name) {
                            ForEach(section.items) { item in
                                row(item, detail: item.piece)
                            }
                        }
                    }
                case .library:
                    ForEach(store.sections(store.items(in: .library))) { section in
                        Section(section.name) {
                            ForEach(section.items) { item in
                                row(item, detail: "")
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.sidebar)
        .safeAreaInset(edge: .top) {
            HStack(spacing: 10) {
                Text("¶")
                    .font(.system(size: 32, weight: .bold, design: .serif))
                    .foregroundStyle(LinearGradient(
                        colors: [Color(red: 0.37, green: 0.55, blue: 0.94), Color(red: 0.18, green: 0.33, blue: 0.79)],
                        startPoint: .top, endPoint: .bottom))
                Text("Techwriter").font(.title3.weight(.semibold))
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
        .safeAreaInset(edge: .bottom) {
            Text("\(progress.doneCount(store.drills.map(\.id))) of \(store.drills.count) drills done")
                .font(.callout.weight(.medium))
                .frame(maxWidth: .infinity)
                .padding(10)
                .background(.bar)
        }
    }

    private func row(_ item: Item, detail: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            if !item.badge.isEmpty {
                Text(item.badge)
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .frame(width: 32, alignment: .leading)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(item.title).lineLimit(2)
                if !detail.isEmpty {
                    Text(detail)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            Spacer(minLength: 4)
            if progress.isDone(item.id) {
                Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
            } else if !item.drills.isEmpty {
                Text("\(progress.doneCount(item.drills))/\(item.drills.count)")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
        .tag(item.id)
    }

    private func expanded(_ name: String) -> Binding<Bool> {
        Binding(
            get: { !collapsed.contains(name) },
            set: { open in
                var set = collapsed
                if open { set.remove(name) } else { set.insert(name) }
                collapsedRaw = set.sorted().joined(separator: "\n")
            })
    }
}
