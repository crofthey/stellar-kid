# StellarKid Mobile Migration Plan

## Scope Overview
- Goal: Deliver a native Android application (iOS to follow) that reproduces all parent-facing features of the existing web app, excluding the `/admin` panel.
- Backend: Continue using the current Cloudflare Worker APIs with the same data model (`shared/types.ts`).
- Guiding principle: Reuse business rules and UX flows where possible while adapting interactions to native paradigms.

## Current Web Feature Inventory (Non-Admin)

| Area | Key Capabilities | Notes / Dependencies |
|------|------------------|-----------------------|
| **Auth Flow** (`/auth`, `/forgot-password`, `/reset-password`) | Email+password login & registration, forgot/reset password, session persistence via `localStorage`, redirect to dashboard when authenticated. | Relies on `/api/auth/*` endpoints and `/api/users/me` for token validation. Displays toast feedback (`sonner`). |
| **Home Redirect** (`/`) | Boots app, waits for auth initialization, forwards to `/dashboard` or `/auth`. | Uses Zustand store `useAuthStore`. |
| **Dashboard** (`/dashboard`) | Lists children, create new child, delete child, navigate to child chart, submit parent feedback, open parent settings (change password), logout. | Uses `useChartStore` for child data, `/api/children`, `/api/feedback`, `/api/auth/change-password`. Logout clears token and auth store. |
| **Child Chart** (`/child/:childId`) | Weekly grid with 3 slots/day, toggle slot state (empty→star→cross), optimistic updates, weekly navigation, chart reset, theme/background selection, prize mode (daily/weekly), rename child, prize box, prize target management & progress, Add-to-home banner. | Heavy use of `useChartStore`, `/api/children/:id/chart/*`, `/api/children/:id/prizes/*`, `/api/children/:id/settings`, `/api/children/:id/targets*`. Depends on theming hooks, wallpaper assets, `date-fns` utils. |
| **Parent Settings Menu** | Change password within dashboard. | `/api/auth/change-password`. |
| **Feedback Submission** | Send message with minimum text length. | `/api/feedback`. |
| **Theme & Personalization** | Dark mode toggle (`useTheme`), chart color palettes (`useChartTheme`), background wallpapers per child. | Persists preferences in `localStorage` (`theme`, `stellarkid-chart-theme`). |

### Data Model Highlights
- `AuthResponse` contains `token` + `user` (mirrors `UserResponse`). Token is Bearer JWT stored in `localStorage` key `stellar-kid-token`.
- `Child` encapsulates prize counts, chart background, prize targets, totals for stars/days/weeks, etc.
- `ChartWeek` is keyed by `childId:year-week` and contains `WeekData` (map of day index → 3-slot tuple).
- Prize targets track goal type (`stars | days | weeks`), counts, achieved status, and timestamps.

### API Surface Used by Web App
- `GET /api/users/me`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `GET /api/children`
- `POST /api/children`
- `DELETE /api/children/{childId}`
- `GET /api/children/{childId}/chart/{year}/{week}`
- `POST /api/children/{childId}/chart/{year}/{week}` (slot update)
- `POST /api/children/{childId}/chart/{year}/{week}/reset`
- `POST /api/children/{childId}/prizes/increment`
- `POST /api/children/{childId}/prizes/decrement`
- `POST /api/children/{childId}/targets`
- `PUT /api/children/{childId}/targets/{targetId}`
- `DELETE /api/children/{childId}/targets/{targetId}`
- `POST /api/feedback`

### Web Client State & Storage
- **Auth state** handled by `useAuthStore` (Zustand + Immer). Responsible for token persistence, initialization, login/logout, password flows. Uses `toast` notifications and redirects on 401.
- **Chart state** handled by `useChartStore` for child list, selected child, week data, prize targets, and chart updates. Employs optimistic UI updates, local derived calculations (perfect day/week detection), and resets when auth state changes.
- **Local storage keys**: `stellar-kid-token`, `stellarkid-chart-theme`, `theme`.
- **Toast notifications**: `sonner` for feedback across flows.

This inventory will drive the Android parity checklist and informs which APIs, calculations, and UX affordances must be mirrored in the native implementation.

## Proposed Android Architecture

### Tech Stack & Libraries
- **Language & UI**: Kotlin + Jetpack Compose (Material 3) for declarative UI and animation parity.
- **Navigation**: `androidx.navigation.compose` with typed destinations for the auth flow, dashboard, child chart, and settings sub-screens.
- **Dependency Injection**: Hilt for app-wide dependency wiring; keeps future KMP extraction feasible.
- **Concurrency**: Kotlin Coroutines + Flows for async work and state streams.
- **Networking**: Retrofit + OkHttp with Kotlinx Serialization converter. OkHttp interceptors handle auth headers and error mapping.
- **Persistence**: Jetpack DataStore for secure token storage and user preferences (theme, chart theme). Room is optional if we later add offline caching.
- **Image & SVG support**: Coil (with SVG decoder) for wallpaper assets and icons.
- **Testing**: JUnit 5 (`kotest` optional), Turbine for Flow testing, Compose UI tests.
- **Analytics / Logging**: Timber for structured logs (tied into Crashlytics later if needed).

### Modular Structure
```
android/
  app/                 # Android application module (Compose UI shell, navigation host)
  core/designsystem/   # Colors, typography, reusable Compose components (buttons, cards)
  core/network/        # Retrofit service, auth interceptor, DTO ↔ domain mappers
  core/datastore/      # Preferences & token storage abstractions
  core/model/          # Kotlin data classes and sealed models mirroring shared/types.ts
  feature/auth/        # Auth screens + viewmodels + use cases
  feature/dashboard/   # Dashboard list, create child, feedback
  feature/chart/       # Weekly chart UI, prize box, slot toggles, week navigator
  feature/settings/    # Parent password change, child settings, theme selection
  feature/prizetargets/# Prize target manager dialog/sheets
  feature/onboarding/  # (Optional) first-run experience if we add later
``` 
- Each feature module exposes a `Destination` + `ViewModel` and is wired via Hilt modules.
- Core modules keep networking & models testable and ready for sharing with future KMP/iOS work (by moving them into a `shared` Kotlin module later).

### State Management Pattern
- Feature layers follow an MVVM + Unidirectional Data Flow approach:
  - `UiState` immutable data class.
  - `UiEvent` sealed interface for user intents (e.g., `ToggleSlot(day, slot)`).
  - `ViewModel` exposes `StateFlow<UiState>` and processes events via reducers/use cases.
- Compose screens collect state via `collectAsStateWithLifecycle()` to stay lifecycle-aware.

### Screen & Navigation Mapping
- **Splash/Home** → `HomeRoute`: checks token, fetches `/users/me`, routes to auth or dashboard.
- **AuthGraph**: login/register tabbed UI (single composable with two states), forgot password, reset password (token entry).
- **DashboardRoute**: shows child list, create child sheet, parent menu sheet, feedback form. Navigates to `ChildChartRoute(childId)`.
- **ChildChartGraph**: hosts child chart screen plus nested destinations for settings/prize targets using bottom sheets or dialogs.
  - Chart uses `LazyVerticalGrid` for 7 day cards, each containing 3 slot buttons with Compose animations replicating star/cross transitions.
  - Week navigator via top app bar actions (left/right arrow) and `AnimatedContent` for transitions.
  - Prize box & progress cards implemented as Compose `Card`s.

### Networking & Backend Integration
- Base URL stored in build config (`BuildConfig.API_BASE_URL`) so staging/prod can switch.
- `AuthInterceptor` injects `Authorization: Bearer <token>` header when available and listens for `401` to trigger logout.
- Endpoints mapped 1:1 with existing Cloudflare routes (see inventory). Retrofit interface per concern (AuthService, ChildService, FeedbackService).
- Response schema matches `ApiResponse<T>`; we create a generic wrapper to unpack `success/data/error` and throw domain-specific exceptions.
- Error handling surfaces friendly messages via Compose snackbars/toasts (`SnackbarHostState`).

### Persistence & Offline Considerations
- Token + refresh metadata stored encrypted in DataStore (use `androidx.security.crypto` if we need stronger encryption soon).
- Preferences DataStore keeps theme selection, selected wallpaper id per child, optionally cached chart data for last viewed week.
- Initial release can fetch on demand; optional future enhancement: Room cache keyed by `childId:year-week` to support offline viewing.

### Theming & Assets
- Compose Material theme extended with custom color roles matching existing `themes.ts` palette. Expose a `ChartTheme` data class to map to Compose color schemes per child.
- Wallpaper SVGs placed in `android/app/src/main/assets/patterns`. Compose `Brush`/`ImageBitmap` backgrounds replicate layered light/dark overlays (can precompute gradients via Compose).
- Dark mode toggled via `DynamicDarkTheme` state persisted in DataStore.

### Authentication Flow & Session Management
- App launch checks DataStore for token, attempts `/users/me`. Success hydrates `AuthState` + `User`, failure clears token and returns to auth graph.
- Login/Register store token, fire parallel fetch of children.
- Logout clears token, resets feature stores (`ChartRepository` caches), navigates to auth.
- Forgot/Reset follow the same minimal flows as web; reset screen accepts token provided by email (or bypass for testing as current worker returns token directly).

### Prize Logic & Business Rules
- Domain layer replicates helper utilities (`getWeekInfo`, perfect day/week detection) in Kotlin to keep parity.
- Slot toggles perform optimistic updates by updating local `UiState` while firing network request; rollback on failure.
- Prize increments triggered by daily/weekly perfect detection replicating Zustand logic; to avoid duplicate requests we centralize in `ChartRepository`.

### Future iOS Alignment
- The modular split allows later extraction of `core/model`, `core/network`, and business use cases into a Kotlin Multiplatform module consumed by Compose Multiplatform (Android) and SwiftUI (via KMP). For this first Android phase we keep modules JVM-only but avoid Android-specific APIs in core layers to ease migration.

## Migration Strategy (Android Focus)
1. **Bootstrap Project**: Initialize Gradle Kotlin DSL, configure Compose, Hilt, Retrofit, DataStore, and create base modules (`app`, `core/*`).
2. **Mirror Shared Models**: Translate TypeScript interfaces into Kotlin data classes (`ApiResponse`, `AuthResponse`, `User`, `Child`, `ChartWeek`, etc.) with serialization annotations.
3. **Networking Layer**: Implement Retrofit services + repository interfaces covering all endpoints from the inventory.
4. **Auth Feature**: Build auth screens + viewmodels; wire token persistence; integrate navigation guard.
5. **Dashboard Feature**: Display children list, create/delete flows, feedback submission, parent settings dialog (change password).
6. **Chart Feature**: Implement weekly grid, slot toggles, week navigation, prize box, prize target manager, child renaming, background/theme selection.
7. **App Polishing**: Animations, offline/error handling, theming, icons, QA.
8. **Prepare for iOS**: Once Android parity achieved, extract shared logic into KMP module and begin SwiftUI UI layer.

This architecture keeps the Android app idiomatic, testable, and ready for the subsequent iOS implementation while staying aligned with the existing Cloudflare backend.

## Immediate Implementation Backlog
1. **Repository Preparation**
   - Create `android/` folder with Gradle wrapper, settings, and initial modules (`app`, `core:model`, `core:network`, `core:datastore`, `core:designsystem`).
   - Configure root `.gitignore` to include Android/Gradle artifacts (if not already present).
   - Add shared code-style/ktlint config if desired.
2. **Build Configuration**
   - Enable Jetpack Compose, Kotlin JVM target 1.9+, compile/target SDK 35, min SDK 24.
   - Define build flavors for `dev` vs `prod` with `API_BASE_URL` placeholders (point dev to local tunnel or staging Cloudflare worker).
3. **Core Models & Serialization**
   - Translate `shared/types.ts` into Kotlin data classes inside `core:model` with `@Serializable` annotations.
   - Implement mappers if API responses diverge.
4. **Networking Layer**
   - Add Retrofit/OkHttp dependencies, define `ApiResponse<T>` adapter, implement services for Auth, Children, Feedback.
   - Provide `AuthInterceptor` + `NetworkModule` in Hilt.
5. **DataStore & Auth Repository**
   - Create DataStore schema for `auth_token`, `theme_mode`, `chart_theme` per child (can be JSON map or separate store).
   - Implement `AuthRepository` handling login/register/logout/forgot/reset flows against Retrofit services.
6. **Navigation Shell**
   - Scaffold `MainActivity` with Compose Navigation host and placeholder composables for Auth, Dashboard, ChildChart.
   - Add splash/bootstrapping logic verifying stored token.
7. **Feature Placeholders**
   - Stub `feature:auth`, `feature:dashboard`, `feature:chart`, `feature:settings` modules with ViewModel contracts and empty screens so navigation is wired before UI build-out.
8. **CI & Tooling**
   - Optional but recommended: set up Gradle task in repo docs, add command to README for building Android app, configure lint/ktlint and basic unit test GitHub action.

### Environment Values
- `API_BASE_URL` build config values:
  - `debug` / `dev` builds → `https://v1-stellar-kid-chart-753b668b-f235-4cb5-828f-52577da1d80e.mattjclegg.workers.dev`
  - `release` builds → `https://kidstarchart.fun`

Completing the above will give us a runnable Android skeleton ready for iterative feature implementation that mirrors the web experience.
