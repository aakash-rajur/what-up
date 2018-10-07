import React from "react";
import FilterButton from "../FilterButton/FilterButton";
import Footer from "../Footer/Footer";
import NewTask from "../NewTask/NewTask";
import TaskList from "../TaskList/TaskList";
import UpdateAll from "../UpdateAll/UpdateAll";
import {App} from "./App";

describe("App component", () => {
  let component = shallow(<App />);

  it("dom integrity", () => {
    [
      "h1.accent-font-color.title",
      "span.new-task-container",
      NewTask,
      UpdateAll,
      "div.filter-container",
      TaskList,
      Footer
    ].forEach(child => expect(component.find(child).exists()).toBe(true));
    expect(component.find(FilterButton).length).toBe(4);
  });

  it("match snapshot with non-empty list", () => {
    expect(component).toMatchSnapshot();
  });
});
