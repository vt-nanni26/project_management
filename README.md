# KanbanFlow

A Django-based Kanban board application for efficient project management and workflow organization.

## Features

- **Project Management**: Create and manage multiple projects with user ownership.
- **Boards**: Organize work into boards within projects.
- **Lists**: Divide boards into lists (e.g., To Do, In Progress, Done).
- **Cards/Tasks**: Add detailed tasks with titles, descriptions, due dates, priorities, and assignments.
- **User Authentication**: Secure user accounts and project ownership.
- **Responsive Frontend**: Modern, intuitive web interface with dark/light theme support.
- **Search Functionality**: Quickly find tasks across boards.
- **REST API**: Full API support for integration with other tools.

## Technologies Used

- **Backend**: Django 6.0, Django REST Framework
- **Database**: SQLite (default, easily configurable for PostgreSQL/MySQL)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS)
- **Icons**: Font Awesome

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/codealpha_project_management.git
   cd codealpha_project_management
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Navigate to the Django project**:
   ```bash
   cd kanban_backend
   ```

5. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser** (optional, for admin access):
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the development server**:
   ```bash
   python manage.py runserver
   ```

8. **Access the application**:
   Open your browser and go to `http://127.0.0.1:8000`

## Usage

- **Landing Page**: Click "Get Started" to enter the main application.
- **Create Projects**: Start by creating projects to organize your work.
- **Add Boards**: Within projects, create boards for different workflows.
- **Manage Lists and Tasks**: Add lists to boards and populate them with tasks.
- **Task Details**: Click on tasks to edit descriptions, set due dates, priorities, and assignments.
- **Search**: Use the search bar to find specific tasks.
- **Theme Toggle**: Switch between light and dark themes.

## API Endpoints

The application provides a REST API for programmatic access:

- `/api/auth/`: Authentication endpoints
- `/api/projects/`: Project management
- `/api/boards/`: Board operations
- `/api/lists/`: List management
- `/api/cards/`: Card/task operations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Django and Django REST Framework
- Frontend inspired by modern Kanban tools
- Icons provided by Font Awesome