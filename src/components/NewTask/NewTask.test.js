import React from 'react';
import {NewTask} from './NewTask';

describe('NewTask component', () => {
    let newTask = 'helloWorld',
        onChange = stub(),
        addNewTask = stub(),
        props = {
            newTask,
            onChange,
            addNewTask,
            type: 'text',
            autoFocus: true,
            className: 'lorem',
            placeholder: 'ipsum'
        },
        component = mount(<NewTask {...props}/>),
        input = component.find('input');

    it('should render', () =>
        expect(component.find(`input.${props.className}`).exists())
            .toBe(true)
    );

    it('check props', () => {
        let inputProps = {...props, value: props.newTask};
        delete inputProps.newTask;
        delete inputProps.addNewTask;
        Object.entries(inputProps).forEach(([key, value]) =>
            expect(input.prop(key)).toBe(value)
        )
    });

    it('should call addNewTask', () => {
        input.simulate('keyup', {keyCode: 13, target: {value: props.value}});
        expect(addNewTask.called).toBe(true);
        expect(addNewTask.callCount).toBe(1);
        expect(addNewTask.calledWithExactly(props.value)).toBe(true)
    });

    it('match snapshot', () => {
        expect(component).toMatchSnapshot();
    });
});
