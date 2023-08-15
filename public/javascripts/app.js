"use strict";
import debounce from "./debounce.js";

// class Form handles the form input validation, escaping inputs, formatting the input data to be sent to the server.

class Form {
  isValid(form) {
    const title = form.querySelector('input[name="title"]').value;
    if (title.length >= 3) {
      return true;
    }
    return false;
  }

  // DOMPurify is used here for validation

  anyUncleanInputs(form) {
    const title = form.querySelector('input[name="title"]').value;
    const cleanTitle = DOMPurify.sanitize(
      form.querySelector('input[name="title"]').value
    );
    const description = form.querySelector("textarea").value;
    const cleanDescription = DOMPurify.sanitize(
      form.querySelector("textarea").value
    );
    return !(title === cleanTitle && description === cleanDescription);
  }
  dateAsNumbersOrEmpty(date) {
    return Number.isNaN(Number(date)) ? "" : date;
  }

  // DOMPurify is used here for sanitation
  compileFormInputs(form) {
    return {
      id: form.querySelector('button[name="complete"]').dataset.id,
      title: DOMPurify.sanitize(
        form.querySelector('input[name="title"]').value
      ),
      day: this.dateAsNumbersOrEmpty(form.querySelector("#due_day").value),
      month: this.dateAsNumbersOrEmpty(form.querySelector("#due_month").value),
      year: this.dateAsNumbersOrEmpty(form.querySelector("#due_year").value),
      description: DOMPurify.sanitize(form.querySelector("textarea").value),
    };
  }
}

// ====================

// class Events handles event listeners and handlers. Event listeners that require an HTTP request within the callback are sent to the controller to be handled there. All other event that dont require an HTTP request are found here.

class Events {
  constructor() {
    this.handleTitleInputValidation = debounce(
      this.handleTitleInputValidation,
      300
    );
    this.todoListItemClick = debounce(this.todoListItemClick, 300);
  }

  // event listeners that are handled here

  bindEvents() {
    this.newTodoButtonClick(this.handleNewTodoButtonClick.bind(this));
    this.clearModalEvent(this.handleClearModal.bind(this));
    this.titleInputBlurEvent(this.handleTitleInputValidation);
    this.titleInputEvent(this.handleTitleInputValidation);
    this.popupOKClick(this.handlePopupOKClick.bind(this));
    this.textareaInputEvent(this.handleTextareaInputEvent);
  }

  // event listeners that are handled by the controller

  controllerBoundEvents() {
    return {
      modalFormSubmitEvent: this.modalFormSubmitEvent,
      todoListItemClick: this.todoListItemClick,
      modalMarkButtonClick: this.modalMarkButtonClick,
      todosSibeBarClick: this.todosSibeBarClick,
    };
  }

  // EVENT LISTENERS

  // modal and form events

  newTodoButtonClick(callback) {
    const btn = document.querySelector("label[for='new_item']");
    btn.addEventListener("click", callback);
  }

  clearModalEvent(callback) {
    const modal = document.querySelector("#modal_layer");
    modal.addEventListener("click", callback);
  }

  modalFormSubmitEvent(callback) {
    const form = document.querySelector("#form_modal form");
    form.addEventListener("submit", callback);
  }

  titleInputEvent(callback) {
    const titleInput = document.querySelector("#title");
    titleInput.addEventListener("keyup", callback);
  }

  titleInputBlurEvent(callback) {
    const titleInput = document.querySelector("#title");
    titleInput.addEventListener("blur", callback);
  }

  textareaInputEvent(callback) {
    const textarea = document.querySelector("textarea");
    textarea.addEventListener("keyup", callback);
  }

  modalMarkButtonClick(callback) {
    const btn = document.querySelector('button[name="complete"]');
    btn.addEventListener("click", callback);
  }

  popupOKClick(callback) {
    const wrapper = document.querySelector("#popup_wrapper");
    wrapper.addEventListener("click", callback);
  }

  // todos list events

  todoListItemClick(callback) {
    const list = document.querySelector("table");
    list.addEventListener("click", callback);
  }

  // sidebar event

  todosSibeBarClick(callback) {
    const sidebar = document.querySelector("#sidebar");
    sidebar.addEventListener("click", callback);
  }

  // EVENT HANDLERS

  handleTextareaInputEvent(event) {
    const textarea = event.target;

    if (textarea.value !== DOMPurify.sanitize(textarea.value)) {
      textarea.classList.add("harmful");
    } else {
      textarea.classList.remove("harmful");
    }
  }

  handleNewTodoButtonClick() {
    this.resetModalInvalidClass();
    document.querySelector("#modal_layer").style.display = "block";
    document.querySelector("#form_modal").style.display = "block";
  }

  handleClearModal(event) {
    event.preventDefault();
    if (event.target === event.currentTarget) {
      this.clearModal();
    }
  }

  handleTitleInputValidation(event) {
    const input = event.target;

    if (input.value.length >= 0 && input.value.length < 3) {
      input.classList.remove("harmful");
      input.classList.add("invalid");
    } else if (input.value !== DOMPurify.sanitize(input.value)) {
      input.classList.remove("invalid");
      input.classList.add("harmful");
    } else {
      input.classList.remove("harmful");
      input.classList.remove("invalid");
    }
  }

  handlePopupOKClick(event) {
    event.preventDefault();
    if (event.target.className === "popup_confirm") {
      this.clearPopup();
    }
  }

  // HELPER FUNCTIONS

  resetModalInvalidClass() {
    document.querySelector("#title").classList.remove("invalid");
    document.querySelector("#title").classList.remove("harmful");
    document.querySelector("textarea").classList.remove("harmful");
  }
  clearModal() {
    this.resetModalInvalidClass();
    document.querySelector("#modal_layer").style.display = "none";
    document.querySelector("#form_modal").style.display = "none";
    document.querySelector("#form_modal form").reset();
  }

  clearPopup() {
    document.querySelector("#popup_wrapper").style.display = "none";
    const containers = document.querySelectorAll(".popup_container");
    for (const popup of containers) {
      popup.style.display = "none";
    }
  }
}

// ===============

// class Todos handles the todos data from the server and formats it to be usable within the Handlebars templates. Class Todos also handles the sorting and order of how the todos are diplayed (completed or not with the all todos displays)

class Todos {
  constructor(todos) {
    this.todos = this.orderTodosByDate(
      this.formatTodoData([].slice.call(todos))
    );
    this.done = this.findDoneTodos(this.todos);
    this.todos_by_date = this.sortTodosByDate(this.todos);
    this.done_todos_by_date = this.sortDoneTodosByDate(this.done);
  }

  formatTodoData(todos) {
    return todos.map((todo) => {
      const obj = {
        id: todo["id"],
        title: todo["title"],
        due_date: this.findDueDate(todo),
        completed: todo["completed"] === true,
        description: todo["description"],
      };
      return obj;
    });
  }

  orderTodosByID(todos) {
    if (!todos) return;
    let doneTodos = todos.filter((todo) => {
      return todo.completed;
    });
    let unCompletedTodos = todos.filter((todo) => {
      return !todo.completed;
    });

    doneTodos = doneTodos.sort((a, b) => {
      return a.id - b.id;
    });

    unCompletedTodos = unCompletedTodos.sort((a, b) => {
      return a.id - b.id;
    });
    return [...unCompletedTodos, ...doneTodos];
  }

  orderTodosByDate(todos) {
    if (!todos) return;

    let noDueDates = todos
      .filter((todo) => {
        return todo.due_date === "No Due Date";
      })
      .sort((a, b) => {
        return a.id - b.id;
      });

    let dueDates = todos.filter((todo) => {
      return todo.due_date !== "No Due Date";
    });

    dueDates = dueDates.sort((a, b) => {
      return Number(a.due_date.slice(0, 2)) - Number(b.due_date.slice(0, 2));
    });
    dueDates = dueDates.sort((a, b) => {
      return Number(a.due_date.slice(3, 5)) - Number(b.due_date.slice(3, 5));
    });

    return [...noDueDates, ...dueDates];
  }

  findDueDate(todo) {
    if (
      todo["month"].length === 0 ||
      todo["year"].length === 0 ||
      todo["day"].length > 2 ||
      todo["month"].length > 2 ||
      todo["year"].length > 4
    ) {
      return "No Due Date";
    } else {
      return todo["month"] + "/" + todo["year"].slice(2);
    }
  }

  findDoneTodos(todos) {
    return todos.filter((todo) => {
      return todo["completed"];
    });
  }

  // ensures that "No Due Date" comes first if it exists

  sortTodosByDate(todos) {
    const data = {
      "No Due Date": [],
    };
    todos.forEach((todo) => {
      const dueDate = todo["due_date"];
      if (data[dueDate]) {
        data[dueDate].push(todo);
      } else {
        data[dueDate] = [todo];
      }
    });
    if (data["No Due Date"].length === 0) {
      delete data["No Due Date"];
    }
    return data;
  }

  // ensures that "No Due Date" comes first if it exists

  sortDoneTodosByDate(todos) {
    const data = {
      "No Due Date": [],
    };
    todos.forEach((todo) => {
      const dueDate = todo["due_date"];
      if (data[dueDate]) {
        data[dueDate].push(todo);
      } else {
        data[dueDate] = [todo];
      }
    });
    if (data["No Due Date"].length === 0) {
      delete data["No Due Date"];
    }
    return data;
  }
}

// ===============

// Model handles all the HTTP requests to the server and rends the response to the controller. The Model does no response handling as that is determined by the controller.

class Model {
  async getAllTodos() {
    try {
      return await fetch("/api/todos");
    } catch (error) {
      return error;
    }
  }
  async getTodoByID(id) {
    try {
      return await fetch(`/api/todos/${id}`);
    } catch (error) {
      return error;
    }
  }
  async createNewTodo(data) {
    try {
      return await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      return error;
    }
  }
  async updateTodo(todo) {
    try {
      return await fetch(`/api/todos/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(todo),
      });
    } catch (error) {
      return error;
    }
  }

  async completeTodo(id) {
    try {
      return await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: true }),
      });
    } catch (error) {
      return error;
    }
  }
  async removeCompleted(id) {
    try {
      return await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: false }),
      });
    } catch (error) {
      return error;
    }
  }
  async deleteTodoByID(id) {
    try {
      return await fetch(`/api/todos/${id}`, { method: "DELETE" });
    } catch (error) {
      return error;
    }
  }
}

// ===============

// View handles all the template and partials compilation and display rendering.

class View {
  constructor() {
    this.templates = {};
    this.compileTemplatesAndRegisterPartials();
  }
  compileTemplatesAndRegisterPartials() {
    const templates = document.querySelectorAll('[type="text/x-handlebars"]');
    templates.forEach((template) => {
      this.templates[`${template.id}`] = Handlebars.compile(template.innerHTML);
      if (template.dataset.type === "partial") {
        this.registerPartial(template);
      }
    });
  }
  registerPartial(partial) {
    Handlebars.registerPartial(partial.id, this.templates[`${partial.id}`]);
  }
  renderPage(todos) {
    this.clearBody();
    const html = this.templates.main_template(todos);
    document
      .querySelector("#page_container")
      .insertAdjacentHTML("afterbegin", html);
  }

  popup(type) {
    const wrapper = document.querySelector("#popup_wrapper");
    switch (type) {
      case "mark":
        const markPopup = document.querySelector("#mark_popup_container");
        markPopup.style.display = "block";
        wrapper.style.display = "block";
        break;
      case "save":
        const savePopup = document.querySelector(
          "#invalid_title_popup_container"
        );
        savePopup.style.display = "block";
        wrapper.style.display = "block";
        break;
      case "unclean":
        const uncleanPopup = document.querySelector(
          "#unclean_input_popup_container"
        );
        uncleanPopup.style.display = "block";
        wrapper.style.display = "block";
        break;
      case "oops":
        const oopsPopup = document.querySelector("#oops_popup_container");
        oopsPopup.style.display = "block";
        wrapper.style.display = "block";
        break;
    }
  }
  fillInModal(data) {
    const form = document.querySelector("#form_modal form");
    const title = data.title;
    const day = data.day === "" ? "Day" : data.day;
    const month = data.month === "" ? "Month" : data.month;
    const year = data.year === "" ? "Year" : data.year;
    // const description = decodeURIComponent(data.description);
    const description = data.description;

    form.querySelector('input[name="title"]').value = title;
    form.querySelector("#due_day").value = day;
    form.querySelector("#due_month").value = month;
    form.querySelector("#due_year").value = year;
    form.querySelector("textarea").value = description;
    form.querySelector("button[name='complete']").dataset.id = data.id;
  }
  // HELPER METHODS

  clearBody() {
    document.querySelector("#page_container").replaceChildren();
  }
}

// ===============

// The `controller` handles the communication between the other classes (model, view, events, todos, form). The `controller` deals with events within `Events` that require an HTTP request within the `Model`, determining when and what is rendered by the `View`, when and how the todos data from the `Todos` is used, and when `Form` is used to handle user form inputs and validation.

class Controller {
  constructor() {
    this.model = new Model();
    this.view = new View();
    this.events = new Events();
    this.form = new Form();
    this.todos;
    this.initPage();
  }

  // START THE PAGE :)

  async initPage() {
    await this.refreshPage("All Todos");
  }

  // EVENT BINDING HANDLING METHODS ====================

  bind(listeners) {
    listeners.modalFormSubmitEvent(this.handleFormSubmit.bind(this));
    listeners.todoListItemClick(this.handletodoListItemClick.bind(this));
    listeners.modalMarkButtonClick(this.handleModalMarkButton.bind(this));
    listeners.todosSibeBarClick(this.handleTodosSibeBarClick.bind(this));
  }

  handleTodosSibeBarClick(event) {
    event.preventDefault();
    const target = event.target.closest("[data-title]");
    const section = event.target.closest("section").id;
    if (target.dataset.title) {
      const title = target.dataset.title;
      this.refreshPage(title, section);
    }
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = this.form.compileFormInputs(form);
    const isNewTodo = data.id.length === 0;

    if (this.form.anyUncleanInputs(form)) {
      this.view.popup("unclean");
    } else if (!this.form.isValid(form)) {
      this.view.popup("save");
      document.querySelector("#title").classList.add("invalid");
    } else if (this.form.isValid(form) && isNewTodo) {
      this.sendNewTodo(data);
    } else {
      this.sendUpdate(data);
    }
  }

  async handletodoListItemClick(event) {
    event.preventDefault();
    let target;
    switch (event.target.tagName) {
      case "LABEL":
        target = event.target;
        break;
      default:
        target = event.target.closest("td");
        break;
    }
    const id = target.closest("tr").dataset.id;

    if (target.className === "delete") {
      this.deleteTodo(id);
    } else if (target.className === "list_item") {
      this.toggleCompleted(target, id);
    } else if (target.className === "todo_label") {
      this.editTodo(id);
    }
  }

  async handleModalMarkButton(event) {
    event.preventDefault();
    const isNewTodo = event.target.dataset.id.length === 0;
    if (isNewTodo) {
      this.view.popup("mark");
    } else {
      try {
        const id = event.target.dataset.id;
        const currentTitle = this.currentTitle();
        const response = await this.model.completeTodo(id);
        if (response.status === 200) {
          this.refreshPage(currentTitle);
        } else {
          this.view.popup("oops");
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  // EVENT HANDLER HELPER METHODS ====================

  async editTodo(id) {
    try {
      const response = await this.model.getTodoByID(id);
      if (response.status === 200) {
        const data = await response.json();
        this.view.fillInModal(data);
        document.querySelector("label[for='new_item']").click();
      } else {
        this.view.popup("oops");
      }
    } catch (error) {}
  }

  async toggleCompleted(target, id) {
    const title = this.currentTitle();
    const active = document.querySelector("#sidebar .active");
    const section = active.closest("section").className;
    target.firstElementChild.toggleAttribute("checked");
    if (target.firstElementChild.checked) {
      try {
        const response = await this.model.completeTodo(id);
        if (response.status === 200) {
          this.refreshPage(title, section);
        } else {
          this.view.popup("oops");
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        const response = await this.model.removeCompleted(id);
        if (response.status === 200) {
          this.refreshPage(title, section);
        } else {
          this.view.popup("oops");
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  // HTTP REQUEST METHODS ====================

  async updateTodos() {
    try {
      const response = await this.model.getAllTodos();
      if (response.status === 200) {
        const todos = await response.json();
        this.todos = new Todos(todos);
      } else {
        this.view.popup("oops");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async sendNewTodo(data) {
    try {
      const response = await this.model.createNewTodo(data);
      if (response.status === 201) {
        this.events.clearModal();
        await this.updateTodos();
        this.refreshPage("All Todos");
      } else {
        this.view.popup("oops");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async sendUpdate(data) {
    const title = this.currentTitle();
    const active = document.querySelector("#sidebar .active");
    const section = active.closest("section").className;
    try {
      const response = await this.model.updateTodo(data);
      if (response.status === 200) {
        this.events.clearModal();
        await this.updateTodos();
        this.refreshPage(title, section);
      } else {
        this.view.popup("oops");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async deleteTodo(id) {
    const title = this.currentTitle();
    const active = document.querySelector("#sidebar .active");
    const section = active.closest("section").className;
    try {
      const response = await this.model.deleteTodoByID(id);
      if (response.status === 204) {
        await this.updateTodos();
        this.refreshPage(title, section);
      } else {
        this.view.popup("oops");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // RENDER DISPLAY METHODS ====================

  async refreshPage(title, section = "all") {
    try {
      await this.updateTodos();
      if (section === "all") {
        this.displayAll(title);
        this.highlightAllTodosSidebar(title);
      } else {
        this.displayCompleted(title);
        this.highlightCompetedTodosSidebar(title);
      }
      this.events.bindEvents();
      this.bind(this.events.controllerBoundEvents());
    } catch (error) {
      console.log(error);
    }
  }

  displayAll(title) {
    const formattedTodos = this.formatAllTodosByTitle(this.todos, title);
    this.view.renderPage(formattedTodos);
  }

  displayCompleted(title) {
    const formattedTodos = this.formatDoneTodosByTitle(this.todos, title);
    this.view.renderPage(formattedTodos);
  }

  formatAllTodosByTitle(todos, title) {
    switch (title) {
      case "All Todos":
        const all = {
          selected: this.todos.orderTodosByID(todos.todos),
          current_section: {
            title,
            data: todos.todos.length,
          },
        };
        return Object.assign(todos, all);
      default:
        const others = {
          selected: this.todos.orderTodosByID(todos.todos_by_date[title]),
          current_section: {
            title,
            data: todos.todos_by_date[title]
              ? todos.todos_by_date[title].length
              : 0,
          },
        };
        return Object.assign(todos, others);
    }
  }
  formatDoneTodosByTitle(todos, title) {
    switch (title) {
      case "Completed":
        const completed = {
          selected: todos.done,
          current_section: {
            title,
            data: todos.done.length,
          },
        };
        return Object.assign(todos, completed);
      default:
        const others = {
          selected: todos.done_todos_by_date[title],
          current_section: {
            title,
            data: todos.done_todos_by_date[title]
              ? todos.done_todos_by_date[title].length
              : 0,
          },
        };
        return Object.assign(todos, others);
    }
  }

  // HELPER METHODS

  currentTitle() {
    return document.querySelector("header time").innerText;
  }

  highlightAllTodosSidebar(title) {
    const sidebar = document.querySelector(`[data-title="${title}"]`);
    if (sidebar) {
      sidebar.classList.add("active");
    }
  }

  highlightCompetedTodosSidebar(title) {
    const completed = document.querySelector("#completed_items");
    const sidebar = completed.querySelector(`[data-title="${title}"]`);
    if (sidebar) {
      sidebar.classList.add("active");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Controller();
});
