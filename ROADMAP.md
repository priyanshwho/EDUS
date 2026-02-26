# 🚀 EduSphere Roadmap & Features

## 1. Current Status (What EduSphere Does Right Now)

Currently, **EduSphere** serves as a centralized, static resource hub for **Information Technology (IT)** and potentially **Electronics (ECE)** students.

### **Tech Stack**
- **Frontend:** React (Vite), Tailwind CSS
- **Data Management:** Static JSON/JS files (`Gemini.json`, `Lecture.js`)

### **Core Features**
- **Resource Repository:** Organized access to:
  - **E-Notes:** Subject-wise PDF notes (hosted on Google Drive).
  - **PYQs (Previous Year Questions):** Collections of past exam papers.
  - **Lecture Videos:** Curated YouTube playlists embedded directly.
- **Branch Support:** Primarily focuses on IT semesters (1-6) and some ECE subjects.
- **Data Structure:** Maps subjects to their respective drive links and YouTube playlists via local static files.
- **UI/UX:** Modern, responsive interface using Tailwind CSS with specialized components for lectures and notes.

---

## 2. 🔮 Future Scope (The Expansion Plan)

The goal is to transition from a static resource site to a dynamic **Learning Management System (LMS)** with role-based access, community interaction, and AI capabilities.

### **A. User Roles & Authentication**
We will implement a secure authentication system supporting **Google** and **GitHub OAuth** (potentially using Clerk, which is already in `package.json`, or Firebase/Auth.js).

- **👩‍🎓 Student Role:**
  - **Access:** View all notes, PYQs, and lecture videos.
  - **Personalization:** "Saved" or "Favorited" resources list.
  - **Search:** ability to search resources by Subject Name, Topic, or Professor Name.

- **👨‍🏫 Professor Role:**
  - **Access:** View all student resources.
  - **Contribution:** Dedicated dashboard to **upload** assignments, class notes, and lecture links.
  - **Profile:** A public profile page listing their specific subjects and uploaded materials.

- **🛡️ Admin Role:**
  - **Authentication:** Hardcoded secure credentials for master access.
  - **Management:** Full control to add/delete subjects, manage user roles (approve professors), and moderate uploaded content.

### **B. EduAI Integration (New Standalone App)**
A separate, high-performance AI application linked via iframe.

- **Architecture:** Standalone app integrated into EduSphere via `<iframe>`.
- **Tech Stack:**
  - **Framework:** Next.js 15 + React 19
  - **Styling:** Tailwind v4 + Shadcn/ui
  - **Auth:** BetterAuth (GitHub, Google)
  - **Payments:** Stripe billing integration
  - **Deployment:** Vercel

- **Key Features:**
  - **⚡ AI-Powered Agent:** Utilizing Claude, Grok, & other LLMs.
  - **🔍 Web Capabilities:** Tools to extract content from URLs and search the web.
  - **🛠️ Tool Chaining:** Create & find tools to build complex workflows.
  - **🧪 Testing:** Integrated testing with TestSprite.
  - **📱 Responsive:** Fully mobile-optimized design.

### **C. Search & Navigation**
- **Global Search Bar:** A powerful dashboard search input.
  - *Input:* "Data Structures" → *Output:* DAA Notes, DAA PYQs, DAA Lectures.
  - *Input:* "Dr. Sharma" → *Output:* All notes and assignments uploaded by Dr. Sharma.

### **D. Database & Backend Expansion**
- **Transition to Dynamic DB:** Move data from `Gemini.json` to a real database (e.g., **MongoDB**, **PostgreSQL**, or **Firebase/Supabase**) to allow dynamic uploads.
- **File Storage:** Integrate cloud storage (**AWS S3**, **Cloudinary**, or **Firebase Storage**) for hosting PDF files and assignments.

### **E. Recommended Additional Features**
- **📢 Notice Board / Announcements:** For urgent updates (e.g., "Class cancelled").
- **💬 Q&A Forum:** Discussion tabs under subjects for student/professor interaction.
- **📝 Quiz/Assessment Module:** Simple MCQ quizzes created by professors.
- **📅 Academic Calendar:** Track exam dates, holidays, and submission deadlines.
