# SDG Research Connector (SRC)

A web application that connects BYU faculty and staff with research opportunities aligned with the UN's Sustainable Development Goals (SDGs).

## Overview

SRC indexes academic papers and researcher profiles from open sources, classifies them according to UN SDGs using machine learning, and provides intelligent recommendations for cross-university collaboration based on shared research interests.

## Features

- **Semantic Search**: Find research papers by SDG classification and text-based queries using vector embeddings
- **Smart Recommendations**: Discover potential collaborators across institutions with shared SDG interests
- **BYU SSO Integration**: Secure authentication through BYU's Single Sign-On system
- **Analytics Dashboard**: Track search patterns and engagement metrics through Power BI

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS 3
- React Router 6
- Recharts for data visualization

### Backend
- Supabase (PostgreSQL with pgvector)
- Row-level security (RLS)
- Auto-generated REST APIs
- Storage buckets for PDFs

### ML & Classification
- Vercel Python Serverless Functions
- Sentence Transformers (all-MiniLM-L6-v2)
- OSDG classifier for SDG tagging

### Analytics
- Power BI Pro
- Supabase Studio

### Hosting
- Vercel (frontend and serverless functions)
- Supabase free tier (database and storage)

## Project Structure
```
SDG-Research-Connector/
├── api/                      # Vercel serverless functions
│   ├── embed.py             # Generate embeddings
│   ├── classify.py          # OSDG classification
│   └── requirements.txt
├── supabase/
│   ├── migrations/          # Database migrations
│   └── config.toml
├── src/                     # React application
│   ├── components/          # Reusable components
│   ├── pages/              # Page components
│   ├── lib/                # Supabase client
│   └── utils/              # Helper functions
├── public/
├── .env.local              # Local environment variables (gitignored)
├── .env.example            # Environment variable template
└── package.json
```

## Database Schema

The application uses PostgreSQL with pgvector extension for semantic search capabilities. Key tables include:

- `papers` - Research papers with embeddings
- `authors` - Researcher profiles
- `institutions` - Academic institutions
- `sdgs` - UN Sustainable Development Goals
- `paper_sdgs` - Paper-to-SDG mappings
- `recommendations` - Collaboration recommendations
- `search_logs` - Search analytics

## Contributing

1. Create a feature branch: `git checkout -b feature-name`
2. Make changes and commit: `git commit -m "Description"`
3. Push to branch: `git push origin feature-name`
4. Create a Pull Request

## Team

- **Product Owner**: Eva Witesman
- **Project Lead**: Matt Cooper
- **Lead Developer**: Christian Taylor
- **Junior Developer**: Levi Henstrom

## Documentation

- [Software Design Document](Coming soon)
- [API Documentation](Coming soon)
- [Database Schema](Coming soon)

## License

Internal BYU project - All rights reserved

## Support

For issues or questions, contact the development team or create an issue in the repository.