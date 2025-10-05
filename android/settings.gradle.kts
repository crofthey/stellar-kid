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
include(":core:model")
include(":core:network")
include(":core:datastore")
include(":core:designsystem")
include(":feature:auth")
include(":feature:dashboard")
include(":feature:chart")
include(":feature:settings")
