# Tasks Manager

## Description

This is an application for creating, editing, completing, and deleteing todo list items.

## Code Implementation

I have chosen to organize my code using the MVC achitecture. Other than the model, view and controller I have chosen to add a few classes to help with organization: todo, events and form.

- The `Model` handles requestes to the server (GET, POST, PUT & DELETE) and send the response to the controller.
- The `View` handles compiling Handlebars templates, registering partials, and rendering the html.
- The `Todos` handles the todos data from the server and formats it to be usable within the Handlebars templates. `Todos` also handles the sorting and order of how the todos are diplayed (completed or not with the all todos displays).
- The `Events` handles event listeners and handlers. Event listeners that require an HTTP request within the callback are sent to the controller to be handled there. All other event that dont require an HTTP request are found here.
- The `Form` handles the form input validation, escaping inputs, formatting the input data to be sent to the server.
- The `controller` handles the communication between the other classes (model, view, events, todos, form). The `controller` deals with events within `Events` that require an HTTP request within the `Model`, determining when and what is rendered by the `View`, when and how the todos data from the `Todos` is used, and when `Form` is used to handle user form inputs and validation.

## Startup

-Ensure that you have node (version > 8.0) and npm installed on your computer.
-Navigate to the application directory in the terminal.
-Run npm install from the command line.
-Run npm start from the command line.
-Open browser to http://localhost:3000

## Additional Infomation

- I've used the provided HTML and CSS but there have been some additional Handlebars templates added and some CSS has been changed.
- I have chosen to the use the `DOMPurify` API to handle user input sanitation. The needed data to use this API is found within the `dist` folder in the `public` folder.
- I chose to include a `debounce` function to help deal with input validation.

