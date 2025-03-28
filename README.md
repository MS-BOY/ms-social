# ms-social

A sophisticated social media platform designed for seamless user interaction, featuring advanced communication and engagement tools.

## Features

- **User Authentication**: Secure user registration and login system
- **Social Networking**: Follow/unfollow users, view profiles, and search for users
- **Content Sharing**: Create and interact with posts including text, media, and polls
- **Interactive Feeds**: Personalized feed based on followed users
- **Media Support**: Upload and share images and videos via Cloudinary integration
- **Real-time Communication**: Direct messaging and conversation management
- **Anonymous Messaging**: Echo Link feature for anonymous messages similar to NGL
- **Notifications**: Real-time notification system for user interactions
- **Responsive Design**: Beautiful and responsive UI that works on all devices

## Technologies

- **Frontend**:
  - React with TypeScript
  - Tailwind CSS + shadcn UI components
  - TanStack Query for data fetching
  - Wouter for routing
  - React Hook Form for form management
  - WebSockets for real-time features

- **Backend**:
  - Express.js server
  - WebSocket Server for real-time communication
  - In-memory data storage (with PostgreSQL option available)
  - Passport.js for authentication
  - Multer for file uploads
  - Cloudinary for media storage

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn package manager
- Cloudinary account for media uploads

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/MS-BOY/ms-social.git
   cd ms-social
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend code
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── contexts/       # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configuration
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Entry point
│   └── index.html          # HTML template
├── server/                 # Backend code
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data storage implementation
│   ├── cloudinary.ts       # Cloudinary integration
│   └── index.ts            # Server entry point
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Data schemas and types
├── uploads/                # Temporary storage for uploads
├── docker-scripts.sh       # Helper script for Docker operations
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker configuration
└── DEPLOYMENT.md           # Deployment guide
```

## Deployment

For detailed deployment instructions, please refer to [DEPLOYMENT.md](DEPLOYMENT.md).

## Docker Support

This application includes Docker support for easy deployment and development.

Build and run with Docker:
```bash
./docker-scripts.sh build   # Build the Docker image
./docker-scripts.sh run     # Run the Docker container
```

Or use Docker Compose:
```bash
./docker-scripts.sh compose-up
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [TanStack Query](https://tanstack.com/query/latest) for data fetching and caching
- [Cloudinary](https://cloudinary.com/) for media handling
- [Tailwind CSS](https://tailwindcss.com/) for styling