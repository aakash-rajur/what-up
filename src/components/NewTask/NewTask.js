import PropTypes from 'prop-types'
import React from 'react';
import {withNewTaskAddition} from "../../utils/apollo";
import Input from "../Input/Input";

export function NewTask({newTask, onChange, addNewTask, ...rest}) {
	let inputProps = {...rest};
	delete inputProps.onDone;
	return (
		<Input value={newTask} onChange={onChange}
		       onValueReturn={addNewTask} {...inputProps}/>
	);
}

NewTask.propTypes = {
	newTask: PropTypes.string,
	onChange: PropTypes.func
};

export default withNewTaskAddition(NewTask);
