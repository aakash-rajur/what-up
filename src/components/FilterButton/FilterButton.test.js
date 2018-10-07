import React from "react";
import {TASK_ALL} from "../../utils/constants";
import FilterButton from "./FilterButton";

describe("FilterButton with default props", () => {
  let active = false,
    component = shallow(<FilterButton />);

  it("should render", () => {
    expect(component.find("button.filter").exists()).toBe(true);
  });

  it(
    "dom tree integrity",
    checkDOM(component, [
      {
        selector: "button.filter",
        props: {
          title: "",
          "data-active": "false",
          disabled: false
        },
        children: [
          {
            selector: "span.badge",
            length: 1
          }
        ]
      },
      {
        selector: "span.badge",
        text: "0"
      }
    ])
  );

  matchSnapshot(component);
});

describe("FilterButton with props", () => {
  let props = {
      active: true,
      title: TASK_ALL,
      stat: 7,
      filter: "filter1",
      onClick: stub()
    },
    component = shallow(<FilterButton {...props} />);

  it("should render", () => {
    expect(component.find("button.filter").exists()).toBe(true);
  });

  it(
    "dom tree integrity",
    checkDOM(component, [
      {
        selector: "button.filter",
        props: {
          title: props.title,
          className: "filter filter1",
          "data-active": props.active,
          disabled: props.active
        },
        children: [
          {
            selector: "span.badge",
            length: 1
          }
        ]
      },
      {
        selector: "span.badge",
        text: props.stat.toString()
      }
    ])
  );

  it(
    "fires onClick",
    checkEvents(component, [
      {
        selector: "button.filter",
        event: "click",
        callback: props.onClick,
        cArgs: [props.filter]
      }
    ])
  );

  matchSnapshot(component);
});
