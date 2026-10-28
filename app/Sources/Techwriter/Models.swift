import Foundation

/// The program as written by tools/build_web.py into content.json, shared with the web app.
struct Program: Decodable {
    var built: String
    var repo: String
    var blurb: String
    var items: [Item]

    static let empty = Program(built: "", repo: "https://github.com/venkatacrc/techwriter", blurb: "", items: [])
}

enum Shelf: String, CaseIterable, Identifiable {
    case today, weeks, drills, library

    var id: String { rawValue }
    var title: String { rawValue.capitalized }
}

struct Item: Decodable, Identifiable, Hashable {
    var id: String
    var view: String
    var section: String
    var kicker: String
    var title: String
    var summary: String
    var minutes: Int
    var skill: String
    var drills: [String]
    var piece: String
    var done: [String]
    /// "attempt" for drills, "draft" for weekly pieces, empty for reading pages.
    var pad: String
    var short: String
    var weeks: [Int]
    var html: String

    enum CodingKeys: String, CodingKey {
        case id, view, section, kicker, title, summary, minutes, skill, drills, piece, done, pad, short, weeks, html
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        view = try c.decodeIfPresent(String.self, forKey: .view) ?? "library"
        section = try c.decodeIfPresent(String.self, forKey: .section) ?? ""
        kicker = try c.decodeIfPresent(String.self, forKey: .kicker) ?? ""
        title = try c.decodeIfPresent(String.self, forKey: .title) ?? id
        summary = try c.decodeIfPresent(String.self, forKey: .summary) ?? ""
        minutes = try c.decodeIfPresent(Int.self, forKey: .minutes) ?? 0
        skill = try c.decodeIfPresent(String.self, forKey: .skill) ?? ""
        drills = try c.decodeIfPresent([String].self, forKey: .drills) ?? []
        piece = try c.decodeIfPresent(String.self, forKey: .piece) ?? ""
        done = try c.decodeIfPresent([String].self, forKey: .done) ?? []
        pad = try c.decodeIfPresent(String.self, forKey: .pad) ?? ""
        short = try c.decodeIfPresent(String.self, forKey: .short) ?? ""
        weeks = try c.decodeIfPresent([Int].self, forKey: .weeks) ?? []
        html = try c.decodeIfPresent(String.self, forKey: .html) ?? ""
    }

    var shelf: Shelf { Shelf(rawValue: view) ?? .library }
    var isDrill: Bool { shelf == .drills }
    var hasPad: Bool { !pad.isEmpty }
    var badge: String { shelf == .weeks && !short.isEmpty ? "W\(short)" : short }
}

struct ItemSection: Identifiable {
    let name: String
    var items: [Item]
    var id: String { name }
}

/// Notes and progress. The same JSON as the web app's "Export notes", so the two can swap files.
struct Progress: Codable {
    var app = "techwriter"
    var start = ""
    var done: [String: String] = [:]
    var notes: [String: String] = [:]
    var checks: [String: [Bool?]] = [:]
    var activity: [String: Int] = [:]

    enum CodingKeys: String, CodingKey {
        case app, start, done, notes, checks, activity
    }

    init() {}

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        start = try c.decodeIfPresent(String.self, forKey: .start) ?? ""
        done = try c.decodeIfPresent([String: String].self, forKey: .done) ?? [:]
        notes = try c.decodeIfPresent([String: String].self, forKey: .notes) ?? [:]
        checks = try c.decodeIfPresent([String: [Bool?]].self, forKey: .checks) ?? [:]
        activity = try c.decodeIfPresent([String: Int].self, forKey: .activity) ?? [:]
    }
}

/// Calendar days, counted the way tools/tw.py and the web app count them.
enum Day {
    static func key(_ date: Date = Date()) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    static func date(_ key: String) -> Date? {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: key)
    }

    /// Python's `date.toordinal()` for today's local date; 719163 is `date(1970, 1, 1).toordinal()`.
    static func ordinal(_ date: Date = Date()) -> Int {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
        var utc = Calendar(identifier: .gregorian)
        utc.timeZone = TimeZone(identifier: "UTC") ?? .current
        let midnight = utc.date(from: DateComponents(year: c.year, month: c.month, day: c.day)) ?? date
        return Int((midnight.timeIntervalSince1970 / 86400).rounded(.down)) + 719163
    }

    static func between(_ a: Date, _ b: Date) -> Int {
        let cal = Calendar.current
        return cal.dateComponents([.day], from: cal.startOfDay(for: a), to: cal.startOfDay(for: b)).day ?? 0
    }

    static func before(_ date: Date) -> Date {
        Calendar.current.date(byAdding: .day, value: -1, to: date) ?? date.addingTimeInterval(-86400)
    }
}
