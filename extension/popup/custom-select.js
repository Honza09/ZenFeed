// Replaces a native <select data-custom> with a styled dropdown. The native
// element stays in the DOM, hidden, and remains the source of truth: popup.js
// keeps reading and setting `select.value`, and a "change" event is fired when
// the person picks an option.
(function () {
  "use strict";

  const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");

  function enhance(select) {
    const wrapper = document.createElement("div");
    wrapper.className = "select";
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    select.classList.add("select-native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "select-button";
    button.id = select.id + "-button";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    const labelElement = select.id ? document.querySelector('label[for="' + select.id + '"]') : null;
    if (labelElement) {
      if (!labelElement.id) {
        labelElement.id = select.id + "-label";
      }
      button.setAttribute("aria-labelledby", labelElement.id + " " + button.id);
      labelElement.addEventListener("click", () => button.focus());
    }

    const list = document.createElement("ul");
    list.className = "select-list";
    list.setAttribute("role", "listbox");
    list.id = select.id + "-list";
    list.hidden = true;
    button.setAttribute("aria-controls", list.id);

    const options = Array.from(select.options).map((option) => {
      const item = document.createElement("li");
      item.className = "select-option";
      item.setAttribute("role", "option");
      item.dataset.value = option.value;
      item.textContent = option.textContent;
      list.appendChild(item);
      return item;
    });

    wrapper.appendChild(button);
    wrapper.appendChild(list);

    let activeIndex = 0;

    function selectedIndex() {
      const value = valueDescriptor.get.call(select);
      const index = options.findIndex((item) => item.dataset.value === value);
      return index < 0 ? 0 : index;
    }

    function render() {
      const index = selectedIndex();
      button.textContent = options[index].textContent;
      options.forEach((item, i) => item.setAttribute("aria-selected", i === index ? "true" : "false"));
    }

    function setActive(index) {
      activeIndex = (index + options.length) % options.length;
      options.forEach((item, i) => item.classList.toggle("active", i === activeIndex));
    }

    function open() {
      wrapper.classList.add("open");
      list.hidden = false;
      button.setAttribute("aria-expanded", "true");
      setActive(selectedIndex());
    }

    function close() {
      wrapper.classList.remove("open");
      list.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }

    function choose(index) {
      const changed = index !== selectedIndex();
      valueDescriptor.set.call(select, options[index].dataset.value);
      render();
      close();
      button.focus();
      if (changed) {
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    // popup.js sets select.value in code; keep the button text in step.
    Object.defineProperty(select, "value", {
      configurable: true,
      get() {
        return valueDescriptor.get.call(select);
      },
      set(value) {
        valueDescriptor.set.call(select, value);
        render();
      },
    });

    button.addEventListener("click", () => (list.hidden ? open() : close()));
    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (list.hidden) {
          open();
        } else {
          setActive(activeIndex + (event.key === "ArrowDown" ? 1 : -1));
        }
      } else if ((event.key === "Enter" || event.key === " ") && !list.hidden) {
        event.preventDefault();
        choose(activeIndex);
      } else if (event.key === "Escape" && !list.hidden) {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "Tab") {
        close();
      }
    });
    options.forEach((item, i) => {
      item.addEventListener("mousemove", () => setActive(i));
      item.addEventListener("click", () => choose(i));
    });
    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        close();
      }
    });

    render();
  }

  document.querySelectorAll("select[data-custom]").forEach(enhance);
})();
