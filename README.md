# 📚 EduSphere - Academic Resource Platform

EduSphere is a modern web application designed to provide students with essential academic resources including previous year question papers, class notes, relevant lectures, and skill development courses.

## 🌟 Features

- **Previous Year Question Papers**: Access to complete sets of PYQs for effective exam preparation
- **Class Notes**: Comprehensive handwritten notes for all subjects
- **Relevant Lectures**: Essential lectures compiled to offer structured learning
- **Skill Development Courses**: Resources for Web Development, AI/ML, and DSA
- **Responsive Design**: Fully responsive interface for all devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v16.0 or later)
- npm (v8.0 or later)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/edusphere.git
   cd edusphere
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## 🛠️ Built With

- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool and development server
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [React Router DOM](https://reactrouter.com/) - For routing
- [React Just Parallax](https://github.com/obadakhalili/react-just-parallax) - For parallax effects
- [Scroll Lock](https://github.com/willmcpo/body-scroll-lock) - For controlling scroll behavior

## 📦 Dependencies

Make sure to run `npm install` to install these dependencies:

```json
"dependencies": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-just-parallax": "^3.1.16",
  "react-router-dom": "^6.10.0",
  "scroll-lock": "^2.1.5"
}
```

## 🔧 Development Dependencies

```json
"devDependencies": {
  "@types/react": "^18.0.28",
  "@types/react-dom": "^18.0.11",
  "@vitejs/plugin-react": "^3.1.0",
  "autoprefixer": "^10.4.14",
  "postcss": "^8.4.21",
  "tailwindcss": "^3.3.1",
  "vite": "^4.2.0"
}
```

## 📁 Project Structure

```
edusphere/
├── src/                  # Source files
│   ├── assets/           # Images, icons, and other static assets
│   ├── components/       # React components
│   │   ├── design/       # Design-specific components
│   │   └── ...           # Other components
│   ├── constants/        # Constants and data
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Public assets
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── package.json          # Project dependencies and scripts
```

## 📝 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run lint` - Lint the codebase
- `npm run preview` - Preview the production build locally

## 🔍 Browser Support

EduSphere supports all modern browsers including:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🚀 Future Implementations

Here are the planned features for future development:

### Backend Development

- **Authentication System**:

  - User registration and login functionality
  - OAuth integration with Google and GitHub
  - Password recovery and email verification
  - Role-based access control (student, teacher, admin)

- **Content Management**:

  - Notes upload, categorization, and retrieval API
  - PYQ database with search and filter capabilities
  - Lecture video storage and streaming optimization
  - Versioning system for updated materials

- **User Interaction**:

  - Feedback collection and management system
  - Ratings and reviews for educational content
  - Contact form submission handling and email notifications
  - User activity tracking and personalized recommendations

- **Additional Features**:
  - Progress tracking for courses
  - Bookmark and favorites functionality
  - Discussion forums for each subject
  - Notification system for new uploads and updates

### Tech Stack for Backend

- Node.js with Express.js for API development
- MongoDB for database
- JWT for authentication
- AWS S3 or similar for file storage
- Socket.io for real-time notifications

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📫 Contact

For questions or feedback, please reach out via email or open an issue in this repository.

---
