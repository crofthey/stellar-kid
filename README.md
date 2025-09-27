# StellarKid: Behavior Chart

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/crofthey/stellarkid)

StellarKid is a visually delightful and interactive web application designed for parents to track their children's daily behavior. It features a persistent, weekly calendar view where each day is divided into three time slots: Morning, Afternoon, and Evening. Parents can award a 'star' for positive behavior or a 'cross' for challenging behavior in each slot. The application provides immediate visual feedback with smooth animations. To motivate children, a special 'present' icon is awarded on Sunday if the entire week (all 21 slots) is filled with stars, signifying a perfect week. The application is built to be intuitive, mobile-first, and aesthetically pleasing, making behavior tracking a positive and engaging experience for both parents and children. All data is saved, allowing users to track progress over time.

## Key Features

-   **Interactive Weekly Chart**: A 7-day grid view, starting from Monday, to track behavior.
-   **Three Daily Time Slots**: Log behavior for Morning, Afternoon, and Evening.
-   **Simple Tracking**: Cycle through states with a single click: Empty -> Star -> Cross.
-   **Perfect Week Reward**: A special 'present' icon appears on Sunday for a week full of stars, providing positive reinforcement.
-   **Persistent Data**: All progress is saved automatically, powered by Cloudflare Durable Objects.
-   **Easy Navigation**: Move between past and future weeks with intuitive controls.
-   **Responsive Design**: A beautiful and functional experience on any device, from mobile phones to desktops.
-   **Delightful UI/UX**: Clean design, smooth animations, and a user-friendly interface.

## Technology Stack

-   **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
-   **Backend**: Hono running on Cloudflare Workers
-   **Storage**: Cloudflare Durable Objects for persistent, stateful data
-   **State Management**: Zustand
-   **Animation & Icons**: Framer Motion, Lucide React
-   **Date & Time**: `date-fns`
-   **Language**: TypeScript

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Bun](https://bun.sh/) package manager
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) - Cloudflare's command-line tool

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/stellar-kid-chart.git
    cd stellar-kid-chart
    ```

2.  **Install dependencies using Bun:**
    ```sh
    bun install
    ```

### Running Locally

To start the development server, which includes both the Vite frontend and the Cloudflare Worker backend with live-reloading, run:

```sh
wrangler dev
```

This will open the application in your default browser, typically at `http://localhost:8788`.

## Project Structure

-   `src/`: Contains the frontend React application source code.
    -   `pages/`: Main application pages.
    -   `components/`: Reusable React components.
    -   `stores/`: Zustand state management stores.
    -   `lib/`: Utility functions and API client.
-   `worker/`: Contains the backend Cloudflare Worker code.
    -   `user-routes.ts`: API route definitions using Hono.
    -   `entities.ts`: Durable Object entity definitions.
-   `shared/`: TypeScript types shared between the frontend and backend.

## Deployment

This project is designed for easy deployment to the Cloudflare network.

1.  **Login to Wrangler:**
    If you haven't already, authenticate Wrangler with your Cloudflare account.
    ```sh
    wrangler login
    ```

2.  **Deploy the application:**
    This command will build the frontend application and deploy it along with the worker to your Cloudflare account.
    ```sh
    wrangler deploy
    ```

Alternatively, you can deploy directly from your GitHub repository using the button below.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/crofthey/stellarkid)

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is licensed under the MIT License.