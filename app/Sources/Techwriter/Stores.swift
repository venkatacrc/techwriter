import AppKit
import Foundation
import UniformTypeIdentifiers

@MainActor
final class ProgramStore: ObservableObject {
    @Published private(set) var program: Program = .empty
    @Published var errorMessage: String?
    private(set) var byID: [String: Item] = [:]
    private var searchText: [String: String] = [:]

    init() { load() }

    /// The copy inside the .app first, then the SwiftPM resource bundle (used by `swift run`).
    func load() {
        guard let url = Bundle.main.url(forResource: "content", withExtension: "json")
            ?? Bundle.module.url(forResource: "content", withExtension: "json") else {
            errorMessage = "content.json is missing from the app. Run scripts/build_app.sh again."
            return
        }
        do {
            program = try JSONDecoder().decode(Program.self, from: Data(contentsOf: url))
            byID = Dictionary(program.items.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
            searchText = Dictionary(program.items.map { ($0.id, Self.plain($0)) }, uniquingKeysWith: { first, _ in first })
        } catch {
            errorMessage = "Could not read content.json: \(error.localizedDescription)"
        }
    }

    private static func plain(_ item: Item) -> String {
        let body = item.html.replacingOccurrences(of: "<[^>]+>", with: " ", options: .regularExpression)
        return [item.title, item.kicker, item.section, item.skill, item.summary, body]
            .joined(separator: " ").lowercased()
    }

    func items(in shelf: Shelf) -> [Item] { program.items.filter { $0.shelf == shelf } }
    var drills: [Item] { items(in: .drills) }

    func search(_ query: String) -> [Item] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return [] }
        return program.items.filter { searchText[$0.id]?.contains(q) ?? false }
    }

    func sections(_ list: [Item]) -> [ItemSection] {
        var out: [ItemSection] = []
        for item in list {
            if let last = out.indices.last, out[last].name == item.section {
                out[last].items.append(item)
            } else {
                out.append(ItemSection(name: item.section, items: [item]))
            }
        }
        return out
    }

    func thisWeek(_ progress: ProgressStore) -> Item? {
        guard let day = progress.programDay, day.week <= 12 else { return nil }
        return byID["week-\(day.week)"]
    }

    /// The same pick as `tw today`: this week's drills, rotated by the calendar day.
    func todaysDrill(_ week: Item?) -> Item? {
        let ids = week.map(\.drills).flatMap { $0.isEmpty ? nil : $0 } ?? drills.map(\.id)
        guard !ids.isEmpty else { return nil }
        return byID[ids[Day.ordinal() % ids.count]]
    }
}

@MainActor
final class ProgressStore: ObservableObject {
    @Published private(set) var data = Progress()
    @Published var errorMessage: String?
    private var saveTask: Task<Void, Never>?

    static var fileURL: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Techwriter", isDirectory: true)
            .appendingPathComponent("progress.json")
    }

    init() {
        if let raw = try? Data(contentsOf: Self.fileURL),
           let decoded = try? JSONDecoder().decode(Progress.self, from: raw) {
            data = decoded
        }
    }

    var started: Bool { !data.start.isEmpty }
    var startDate: Date? { Day.date(data.start) }

    /// Week and day of the program, both counted from 1.
    var programDay: (week: Int, day: Int)? {
        guard let start = startDate else { return nil }
        let days = max(0, Day.between(start, Date()))
        return (days / 7 + 1, days % 7 + 1)
    }

    var streak: Int {
        var n = 0
        var day = Date()
        if data.activity[Day.key(day)] == nil { day = Day.before(day) }
        while data.activity[Day.key(day)] != nil {
            n += 1
            day = Day.before(day)
        }
        return n
    }

    func isDone(_ id: String) -> Bool { data.done[id] != nil }
    func note(_ id: String) -> String { data.notes[id] ?? "" }
    func doneCount(_ ids: [String]) -> Int { ids.filter(isDone).count }

    func check(_ id: String, _ index: Int) -> Bool {
        let list = data.checks[id] ?? []
        return index < list.count ? (list[index] ?? false) : false
    }

    func begin(on date: Date) {
        data.start = Day.key(date)
        touch()
        save()
    }

    func setStart(_ date: Date) {
        data.start = Day.key(date)
        save()
    }

    func toggleDone(_ id: String) {
        if data.done.removeValue(forKey: id) == nil {
            data.done[id] = Day.key()
            touch()
        }
        save()
    }

    func setNote(_ text: String, for id: String) {
        guard data.notes[id] ?? "" != text else { return }
        data.notes[id] = text
        touch()
        saveSoon()
    }

    func setCheck(_ on: Bool, _ index: Int, for id: String) {
        var list = data.checks[id] ?? []
        while list.count <= index { list.append(nil) }
        list[index] = on
        data.checks[id] = list
        touch()
        save()
    }

    func exportNotes() {
        let panel = NSSavePanel()
        panel.title = "Export notes"
        panel.message = "The web app can import this file from its ☰ menu."
        panel.nameFieldStringValue = "techwriter-notes-\(Day.key()).json"
        panel.allowedContentTypes = [.json]
        guard panel.runModal() == .OK, let url = panel.url else { return }
        do {
            try encoded().write(to: url)
        } catch {
            errorMessage = "Export failed: \(error.localizedDescription)"
        }
    }

    /// Merges a notes file exported from the web app or from this app.
    func importNotes() {
        let panel = NSOpenPanel()
        panel.title = "Import notes"
        panel.allowedContentTypes = [.json]
        panel.allowsMultipleSelection = false
        guard panel.runModal() == .OK, let url = panel.url else { return }
        do {
            let incoming = try JSONDecoder().decode(Progress.self, from: Data(contentsOf: url))
            data.done.merge(incoming.done) { _, new in new }
            data.notes.merge(incoming.notes) { _, new in new }
            data.checks.merge(incoming.checks) { _, new in new }
            data.activity.merge(incoming.activity) { _, new in new }
            if data.start.isEmpty { data.start = incoming.start }
            save()
        } catch {
            errorMessage = "That file is not a Techwriter notes export (\(error.localizedDescription))."
        }
    }

    func reset() {
        let alert = NSAlert()
        alert.messageText = "Reset progress?"
        alert.informativeText = "This deletes the start date, ticks and notes stored by this app. Export your notes first if you want to keep them."
        alert.addButton(withTitle: "Reset")
        alert.addButton(withTitle: "Cancel")
        alert.buttons.first?.hasDestructiveAction = true
        guard alert.runModal() == .alertFirstButtonReturn else { return }
        data = Progress()
        save()
    }

    private func touch() { data.activity[Day.key()] = 1 }

    private func saveSoon() {
        saveTask?.cancel()
        saveTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 400_000_000)
            guard !Task.isCancelled else { return }
            self?.save()
        }
    }

    func save() {
        saveTask?.cancel()
        do {
            try FileManager.default.createDirectory(
                at: Self.fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
            try encoded().write(to: Self.fileURL, options: .atomic)
        } catch {
            errorMessage = "Could not save your notes: \(error.localizedDescription)"
        }
    }

    private func encoded() throws -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        return try encoder.encode(data)
    }
}

@MainActor
final class DrillTimer: ObservableObject {
    @Published private(set) var end: Date?
    @Published private(set) var itemID: String?
    @Published var finished: String?
    private var task: Task<Void, Never>?

    func isRunning(_ id: String) -> Bool { end != nil && itemID == id }

    func label(for item: Item, now: Date) -> String {
        guard isRunning(item.id), let end else { return "\(item.minutes):00" }
        let left = max(0, Int(end.timeIntervalSince(now).rounded(.up)))
        return String(format: "%d:%02d", left / 60, left % 60)
    }

    func toggle(_ item: Item) {
        if isRunning(item.id) {
            stop()
            return
        }
        let seconds = Double(max(item.minutes, 1) * 60)
        end = Date().addingTimeInterval(seconds)
        itemID = item.id
        task?.cancel()
        task = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            guard !Task.isCancelled else { return }
            self?.finish()
        }
    }

    func stop() {
        task?.cancel()
        end = nil
        itemID = nil
    }

    private func finish() {
        finished = itemID
        end = nil
        itemID = nil
        NSSound(named: "Glass")?.play()
        NSApp.requestUserAttention(.informationalRequest)
    }
}

/// Which page is open. Shared by the window and the menu commands.
@MainActor
final class Navigator: ObservableObject {
    @Published var selection: String? = nil {
        didSet { remember() }
    }

    private let defaults = UserDefaults.standard

    init() {
        selection = UserDefaults.standard.string(forKey: "selection") ?? "today"
    }

    func current(in store: ProgramStore) -> Item? {
        selection.flatMap { store.byID[$0] }
    }

    func shelf(in store: ProgramStore) -> Shelf {
        current(in: store)?.shelf ?? .today
    }

    func open(_ id: String, in store: ProgramStore) {
        if id == "today" || store.byID[id] != nil { selection = id }
    }

    /// Opens the page last read on that shelf, or its first page.
    func show(_ shelf: Shelf, in store: ProgramStore) {
        guard shelf != .today else {
            selection = "today"
            return
        }
        if let last = defaults.string(forKey: "last_\(shelf.rawValue)"), store.byID[last]?.shelf == shelf {
            selection = last
        } else {
            selection = store.items(in: shelf).first?.id
        }
    }

    func step(_ delta: Int, in store: ProgramStore) {
        guard let item = current(in: store) else { return }
        let list = store.items(in: item.shelf)
        guard let i = list.firstIndex(where: { $0.id == item.id }), list.indices.contains(i + delta) else { return }
        selection = list[i + delta].id
    }

    func canStep(_ delta: Int, in store: ProgramStore) -> Bool {
        guard let item = current(in: store) else { return false }
        let list = store.items(in: item.shelf)
        guard let i = list.firstIndex(where: { $0.id == item.id }) else { return false }
        return list.indices.contains(i + delta)
    }

    /// Ids follow build_web.py: week-N, program and after are weeks; Dnn are drills; the rest is library.
    private func remember() {
        defaults.set(selection ?? "today", forKey: "selection")
        guard let id = selection, id != "today" else { return }
        let shelf: Shelf
        if id.hasPrefix("week-") || id == "program" || id == "after" {
            shelf = .weeks
        } else if id.range(of: "^D[0-9]+$", options: .regularExpression) != nil {
            shelf = .drills
        } else {
            shelf = .library
        }
        defaults.set(id, forKey: "last_\(shelf.rawValue)")
    }
}
