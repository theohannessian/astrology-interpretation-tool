# Astrology Interpretation Tool

A web application that provides astrological interpretations of personal experiences using Claude 3.7 Sonnet.

## Features

- Input personal experiences for astrological interpretation
- Optional zodiac sign and date selection for more personalized readings
- Beautiful, responsive UI with Tailwind CSS
- Integration with Claude 3.7 Sonnet for intelligent interpretations

## Tech Stack

- Frontend: React.js
- Styling: Tailwind CSS
- Backend: Node.js with Express
- AI: Claude 3.7 Sonnet API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/astrology-interpretation-tool.git
cd astrology-interpretation-tool
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3001`.

## Project Structure

```
astrology-interpretation-tool/
├── public/              # Static files
│   ├── index.html
│   └── favicon.ico
├── src/                 # Source files
│   ├── components/      # React components
│   ├── services/        # API services
│   └── utils/           # Utility functions
├── server/              # Backend server
│   ├── routes/          # API routes
│   └── controllers/     # Route controllers
├── .env                 # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Claude 3.7 Sonnet for providing intelligent astrological interpretations
- Tailwind CSS for the beautiful UI components
- React for the frontend framework 