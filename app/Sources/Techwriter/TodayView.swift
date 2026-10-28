import SwiftUI

struct TodayView: View {
    let open: (String) -> Void
    @EnvironmentObject private var store: ProgramStore
    @EnvironmentObject private var progress: ProgressStore
    @StateObject private var startDate = Draft(Date())

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if progress.started { started } else { welcome }
            }
            .frame(maxWidth: 640, alignment: .leading)
            .padding(.horizontal, 36)
            .padding(.vertical, 32)
            .frame(maxWidth: .infinity)
        }
        .background(Color(nsColor: .textBackgroundColor))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(Color(nsColor: .separatorColor)))
        .shadow(color: .black.opacity(0.06), radius: 10, y: 4)
    }

    @ViewBuilder
    private var welcome: some View {
        kicker("12 weeks · 25 minutes a day")
        Text("Build the writing muscle")
            .font(.system(size: 32, weight: .semibold, design: .serif))
        Text(store.program.blurb)
            .font(.system(size: 17, design: .serif))
            .fixedSize(horizontal: false, vertical: true)
        label("The rules")
        VStack(alignment: .leading, spacing: 6) {
            ForEach(Array(rules.enumerated()), id: \.offset) { index, rule in
                Text("\(index + 1). \(rule)").font(.system(size: 15, design: .serif))
            }
        }
        HStack(spacing: 14) {
            DatePicker("Week 1 begins", selection: $startDate.value, displayedComponents: .date)
                .fixedSize()
            Button("Start week 1") { progress.begin(on: startDate.value) }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .keyboardShortcut(.defaultAction)
        }
        .padding(.top, 8)
        Text("Pick the day you ran `tw start` in the terminal, so both choose the same drill.")
            .font(.callout)
            .foregroundStyle(.secondary)
        Button("How the program works") { open("program") }
            .buttonStyle(.link)
    }

    private let rules = [
        "Write before you read the guide.",
        "Never edit while drafting. Timer on, write, stop.",
        "Cool off for 24 hours before reviewing.",
        "Ship on schedule.",
        "No model answers. Reviewers point at problems; you fix them.",
    ]

    @ViewBuilder
    private var started: some View {
        let day = progress.programDay
        let week = store.thisWeek(progress)
        let drill = store.todaysDrill(week)
        if let day, let week {
            kicker("Week \(day.week) of 12 · day \(day.day)")
            title(week.title)
            lead(week.summary)
        } else {
            kicker("After the 12 weeks")
            title("Keep the cadence")
            lead(store.byID["after"]?.summary ?? "")
        }
        label("Today")
        VStack(spacing: 0) {
            if let drill {
                todayRow(badge: drill.short, title: drill.title,
                         detail: "Today's drill · \(drill.minutes) min · \(drill.skill)", id: drill.id)
                Divider()
            }
            if let week {
                todayRow(badge: week.badge, title: "This week's piece", detail: week.piece, id: week.id)
            } else {
                todayRow(badge: "", title: "After week 12",
                         detail: "One drill a day, one finished piece a month, one submission a quarter", id: "after")
            }
        }
        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.primary.opacity(0.05)))

        HStack(spacing: 10) {
            kpi(week.map { "\(progress.doneCount($0.drills))/\($0.drills.count)" } ?? "–", "this week")
            kpi("\(progress.doneCount(store.drills.map(\.id)))", "drills done")
            kpi("\(progress.streak)", "day streak")
        }
        .padding(.top, 6)

        DatePicker("Week 1 began", selection: Binding(
            get: { progress.startDate ?? Date() },
            set: { progress.setStart($0) }), displayedComponents: .date)
            .fixedSize()
            .padding(.top, 8)
        Text("Notes are saved on this Mac. Use File › Export Notes to move them to the web app on your phone.")
            .font(.callout)
            .foregroundStyle(.secondary)
    }

    private func todayRow(badge: String, title: String, detail: String, id: String) -> some View {
        Button { open(id) } label: {
            HStack(spacing: 12) {
                Text(badge)
                    .font(.callout.monospacedDigit())
                    .foregroundStyle(.secondary)
                    .frame(width: 36, alignment: .leading)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.body.weight(.medium))
                    Text(detail).font(.callout).foregroundStyle(.secondary).lineLimit(2)
                }
                Spacer()
                if progress.isDone(id) {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                } else {
                    Image(systemName: "chevron.right").foregroundStyle(.tertiary)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func kpi(_ value: String, _ caption: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title2.weight(.semibold)).monospacedDigit()
            Text(caption).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.primary.opacity(0.05)))
    }

    private func kicker(_ s: String) -> some View {
        Text(s.uppercased())
            .font(.caption.weight(.bold))
            .tracking(0.6)
            .foregroundStyle(Color.accentColor)
    }

    private func title(_ s: String) -> some View {
        Text(s).font(.system(size: 32, weight: .semibold, design: .serif))
    }

    private func lead(_ s: String) -> some View {
        Text(s)
            .font(.system(size: 17, design: .serif))
            .fixedSize(horizontal: false, vertical: true)
    }

    private func label(_ s: String) -> some View {
        Text(s.uppercased())
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
            .padding(.top, 10)
    }
}
