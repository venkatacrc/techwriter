// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Techwriter",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "Techwriter",
            resources: [.copy("Resources/content.json")]
        )
    ]
)
