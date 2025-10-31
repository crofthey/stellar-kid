rootProject.name = "StellarKid"

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

include(":app")
include(":core:datastore")
include(":core:designsystem")
include(":core:model")
include(":core:network")
include(":feature:auth")
include(":feature:chart")
include(":feature:dashboard")
include(":feature:settings")
