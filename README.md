# Aviator Chatbot UI

A production-ready ReactJS application that provides a modern, feature-rich web interface for the Aviator Chatbot system. Built with TypeScript, TailwindCSS, and advanced UI/UX patterns including floating chat windows, role-based access control, and real-time streaming responses.

## 🚀 Latest Features & Updates

### 🔐 Dynamic Authentication System
- **Database-driven user management** with PostgreSQL integration
- **Role-based access control** (Support, Client, Tester roles)
- **Session management** with persistent login state
- **Default users** automatically created on first run
- **Secure password hashing** with backend validation

### 💬 Advanced Chat Interface
- **Floating, draggable chat window** - movable to any screen position
- **Resizable chat panel** - user-adjustable height via drag handles
- **Real-time streaming responses** with 8x faster typing speed
- **History overlay** - sliding history panel over main chat
- **Message feedback system** with like/dislike tracking
- **Auto-focusing input** after responses and interactions
- **Loading animations** with distinct states for API wait vs. streaming
- **Markdown rendering** with custom table styling and code blocks
- **Copy-to-clipboard** functionality for assistant responses

### 📚 Enhanced Document Management
- **Paginated document listing** (10 items per page)
- **Upload modal integration** - accessible from Documents page
- **Icon-only interface** for cleaner UI (edit, delete, upload, refresh)
- **Bulk selection and deletion** with count badges
- **Fixed-width table layout** to prevent UI shifts
- **Role-based visibility** (Support/Tester users only)

### 📊 User Feedback Analytics
- **Comprehensive feedback tracking** stored in PostgreSQL
- **Paginated feedback history** with user interaction data
- **Persistent feedback state** in chat history
- **Real-time feedback indicators** with color-coded icons

### 🎨 Modern UI/UX Design
- **SVG icon system** replacing all emoji icons
- **Consistent color theming** with aviator branding
- **Responsive design** with mobile-friendly interactions
- **Smooth animations** for panel sliding and state transitions
- **Clean typography** with optimized text sizing
- **Professional spacing** and layout consistency

## 🏗️ Architecture Overview

### Frontend Architecture
```
aviator_chatbot_ui/
├── src/
│   ├── components/           # React Components
│   │   ├── Layout.tsx       # Main layout with role-based navigation
│   │   ├── Login.tsx        # Dynamic authentication component
│   │   ├── ChatPanel.tsx    # Floating, draggable chat interface
│   │   ├── DocumentManagement.tsx  # Paginated document management
│   │   ├── UsersFeedback.tsx # Feedback analytics dashboard
│   │   └── Dashboard.tsx    # Role-aware dashboard
│   ├── context/             # State Management
│   │   └── AppContext.tsx   # Global state with useReducer
│   ├── services/            # API Layer
│   │   └── api.ts          # Axios-based API client
│   ├── types/               # TypeScript Definitions
│   │   └── index.ts        # Interface definitions
│   └── styles/             # Styling
│       ├── index.css       # Global styles & animations
│       └── tailwind.config.js  # Custom theme configuration
```

### Backend Integration
```
chatbot_agents/
├── api/                     # FastAPI Endpoints
│   ├── auth_api.py         # User authentication APIs
│   ├── chat_api.py         # Chat & feedback APIs
│   ├── documents_api.py    # Document management APIs
│   └── history_api.py      # Chat history APIs
├── core/services/          # Business Logic
│   ├── user_service.py     # User management service
│   ├── history_service.py  # Chat history service
│   └── document_service.py # Document processing
└── vector/                 # Vector Database
    └── pgvector integration # PostgreSQL with pgvector
```

## 🛠️ Technology Stack

### Frontend Technologies
- **React 19.1.0** with TypeScript for type safety
- **TailwindCSS 3.x** with custom aviator theme
- **React Context API** with useReducer for state management
- **Axios** for HTTP client with interceptors
- **React Markdown** with GitHub Flavored Markdown support
- **Custom CSS animations** for loading and transitions

### Backend Technologies
- **FastAPI** for high-performance API endpoints
- **PostgreSQL** with pgvector for vector operations
- **SQLAlchemy** for database ORM
- **Pydantic** for data validation and serialization
- **Chroma DB** for vector storage and similarity search

### DevOps & Build Tools
- **Create React App** with TypeScript template
- **ESLint & Prettier** for code quality
- **Webpack** for bundling and optimization
- **Docker** support for containerization

## 📋 Prerequisites & Setup

### System Requirements
- **Node.js** 18+ with npm/yarn
- **Python** 3.9+ for backend
- **PostgreSQL** 12+ with pgvector extension
- **Git** for version control

### Environment Setup

#### 1. Frontend Environment (.env)
```env
# API Configuration
REACT_APP_API_BASE_URL=http://127.0.0.1:8001

# Application Configuration
REACT_APP_VERSION=2.0.0
REACT_APP_APP_NAME=Aviator Chatbot UI
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_DEBUG=false
REACT_APP_ENABLE_ANALYTICS=true
```

#### 2. Backend Environment
```env
# Database Configuration
PGVECTOR_CONNECTION_STRING=postgresql+psycopg://postgres:admin@localhost:5432/vectordb

# API Configuration
API_HOST=127.0.0.1
API_PORT=8001
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🚀 Installation & Running

### 1. Frontend Setup
```bash
# Navigate to frontend directory
cd aviator_chatbot_ui

# Install dependencies
npm install

# Start development server
npm start
# App opens at http://localhost:3000
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd chatbot_agents

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start API server
python run_api.py
# API runs at http://127.0.0.1:8001
```

### 3. Database Setup
```sql
-- PostgreSQL setup with pgvector
CREATE DATABASE vectordb;
CREATE EXTENSION vector;

-- User table is auto-created on first API run
-- Default users: admin, kamala, tester, client1
```

## 🔐 Authentication & User Roles

### Default User Accounts
| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| `admin` | `admin123` | Support | Full access to all features |
| `kamala` | `admin` | Support | Full access to all features |
| `tester` | `test123` | Tester | Documents + Feedback access |
| `client1` | `client123` | Client | Chat + Feedback only |

### Role-Based Features
- **Support Users**: All features including document management
- **Tester Users**: Chat, feedback, and document access
- **Client Users**: Chat and feedback only (no documents)

### User Management
- **Dynamic user creation** via UserService
- **Password hashing** with secure algorithms
- **Session persistence** across browser sessions
- **Role validation** on every API request

## 💬 Chat System Features

### Floating Chat Interface
- **Draggable positioning** - move chat anywhere on screen
- **Resizable height** - adjust via drag handles
- **Overlay history panel** - slides over main chat area
- **Persistent position** - remembers user preferences

### Message Features
- **Real-time streaming** with 8x faster typing (8 chars/15ms)
- **Instant user messages** with light blue styling
- **Markdown support** for assistant responses
- **Code highlighting** and table formatting
- **Copy functionality** for all assistant messages

### Chat History
- **Persistent storage** in PostgreSQL
- **Session management** with chat IDs
- **Feedback integration** with like/dislike status
- **Search and filtering** capabilities

## 📚 Document Management

### Upload System
- **Modal-based upload** integrated into Documents page
- **Drag & drop interface** with file validation
- **Multiple file support** (PDF, TXT, Markdown)
- **Metadata management** (category, status, access level)
- **Progress indicators** with success/error feedback

### Management Interface
- **Paginated listings** (10 items per page)
- **Icon-only actions** for clean UI
- **Bulk operations** with selection management
- **Real-time updates** with refresh capability
- **Role-based access** control

## 📊 Analytics & Feedback

### User Feedback System
- **Real-time feedback** on assistant responses
- **Persistent feedback state** in chat history
- **Analytics dashboard** with paginated history
- **Feedback aggregation** for quality metrics

### Data Storage
- **PostgreSQL integration** for all feedback data
- **User interaction tracking** with timestamps
- **Message correlation** with chat history
- **Export capabilities** for analysis

## 🎨 UI/UX Design System

### Color Palette
```css
:root {
  --aviator-blue: #1E40AF;     /* Primary blue */
  --aviator-dark: #003366;     /* Dark text */
  --aviator-light: #f0f8ff;    /* Light backgrounds */
  --border-light: #e5e7eb;     /* Light borders */
}
```

### Typography Scale
- **Text sizes**: xs (10px), sm (12px), base (14px), lg (16px)
- **Font weights**: normal (400), medium (500), semibold (600), bold (700)
- **Line heights**: tight (1.25), normal (1.5), relaxed (1.75)

### Icon System
- **SVG-based icons** for scalability
- **Consistent sizing** (16px, 20px, 24px)
- **Semantic naming** for maintainability
- **Accessibility support** with proper ARIA labels

## 🔧 Development Guidelines

### Code Standards
- **TypeScript strict mode** enabled
- **ESLint + Prettier** for formatting
- **Component-based architecture** with clear separation
- **Props interface definitions** for all components
- **Error boundary implementation** for robust error handling

### Testing Strategy
- **Unit tests** for utility functions
- **Component tests** with React Testing Library
- **Integration tests** for API interactions
- **E2E tests** for critical user flows

### Performance Optimization
- **Code splitting** with React.lazy
- **Memoization** for expensive operations
- **Virtualization** for large lists
- **Bundle analysis** with webpack-bundle-analyzer

## 🚀 Production Deployment

### Build Process
```bash
# Optimize build for production
npm run build

# Analyze bundle size
npm run analyze

# Serve locally for testing
npm run serve
```

### Environment Configuration
```env
# Production environment variables
NODE_ENV=production
GENERATE_SOURCEMAP=false
REACT_APP_API_BASE_URL=https://api.aviator-chat.com
REACT_APP_ENABLE_DEBUG=false
```

### Deployment Options
- **Static hosting**: Netlify, Vercel, AWS S3 + CloudFront
- **Container deployment**: Docker with nginx
- **Server deployment**: Node.js with express-static

## 📈 Monitoring & Analytics

### Error Tracking
- **Console error logging** with structured data
- **API error handling** with user-friendly messages
- **Component error boundaries** for graceful failures

### Performance Metrics
- **Loading time tracking** for key interactions
- **API response time monitoring** 
- **User interaction analytics** for UX optimization

### User Analytics
- **Feature usage tracking** with role-based insights
- **Chat interaction metrics** (messages, feedback, session length)
- **Document management analytics** (uploads, downloads, edits)

## 🔒 Security Considerations

### Frontend Security
- **XSS prevention** with React's built-in protections
- **CSRF protection** via SameSite cookies
- **Input validation** on all user inputs
- **Secure storage** of authentication tokens

### API Security
- **JWT token authentication** with expiration
- **Role-based authorization** on all endpoints
- **Input sanitization** and validation
- **Rate limiting** for API endpoints

## 📝 API Documentation

### Authentication Endpoints
- `POST /auth/login` - User authentication
- `GET /auth/user/{username}` - Get user details
- `POST /auth/validate` - Session validation

### Chat Endpoints
- `POST /chat/` - Send message and get response
- `GET /history/user_history/{username}` - Get user's chat history
- `GET /history/{username}/{chat_id}` - Get specific chat messages
- `POST /chat/feedback` - Submit message feedback
- `GET /chat/feedback/history/{username}` - Get feedback history

### Document Endpoints
- `GET /documents/` - Get paginated document list
- `POST /documents/upload` - Upload new document
- `PATCH /documents/{id}` - Update document metadata
- `DELETE /documents/{id}` - Delete document

## 🐛 Troubleshooting

### Common Issues

#### Authentication Problems
```bash
# Check API connection
curl http://127.0.0.1:8001/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### CORS Issues
```python
# Backend: Ensure CORS is configured
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Database Connection
```sql
-- Check PostgreSQL connection
SELECT version();
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Performance Issues
- **Large chat history**: Implement pagination on frontend
- **Slow document loading**: Add loading states and error boundaries
- **Memory leaks**: Check for proper cleanup in useEffect hooks

## 🤝 Contributing

### Development Workflow
1. **Fork the repository** and create feature branch
2. **Follow TypeScript conventions** and existing patterns
3. **Add tests** for new functionality
4. **Update documentation** for API changes
5. **Submit pull request** with detailed description

### Code Review Checklist
- [ ] TypeScript compilation without errors
- [ ] All tests passing
- [ ] ESLint/Prettier formatting applied
- [ ] Component props properly typed
- [ ] Error handling implemented
- [ ] Documentation updated

## 📄 License

MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **React Team** for the excellent framework
- **TailwindCSS** for the utility-first CSS framework
- **FastAPI** for the high-performance backend framework
- **PostgreSQL & pgvector** for vector database capabilities

---

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Maintainer**: Development Team

For issues, feature requests, or contributions, please refer to the project repository and follow the contributing guidelines.
