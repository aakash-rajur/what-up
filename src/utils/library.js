import React from "react";
import {Mutation} from 'react-apollo';
import {TASK_ALL, TASK_CANCELLED, TASK_COMPLETED, TASK_CREATED} from "./constants";

export function promiseSetState(context) {
	return newState => new Promise(resolve =>
		context.setState(newState, resolve));
}

export function renderMutations(config) {
	return config.map(({mutation, getVariables, renderComponent}, index) => {
		if (!(renderComponent instanceof Function)) return renderComponent;
		return (
			<Mutation key={index} mutation={mutation} variables={getVariables(mutation)}>
				{renderComponent}
			</Mutation>
		)
	});
}

export function getNextUpdateAllStatus(tasks = []) {
	let task = tasks.find(({status}) => status !== TASK_COMPLETED);
	return task ? TASK_COMPLETED : TASK_CREATED;
}

const DAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_MAP = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function padStart(string) {
	return typeof string === 'string' ? string.padStart(2, '0') :
		string.toString().padStart(2, '0');
}

export function getFormattedTimestamp(timestamp) {
	let date = new Date(timestamp);
	// noinspection JSCheckFunctionSignatures
	if (isNaN(date)) return 'Invalid Date';
	let hr = date.getHours(),
		suffix = 'A.M';
	if (hr === 0) {
		hr = 12;
		suffix = 'A.M';
	} else if (hr === 12) {
		suffix = 'P.M';
	} else hr %= 12;
	return `${padStart(hr)}: ${padStart(date.getMinutes())} ${suffix}, ${DAY_MAP[date.getDay()]} ${date.getDate()} ${MONTH_MAP[date.getMonth()]}`
}

export const FILTER_BUTTON_TEMPLATE = [{
	title: 'All',
	filter: TASK_ALL
}, {
	title: 'Active',
	filter: TASK_CREATED
}, {
	title: 'Completed',
	filter: TASK_COMPLETED
}, {
	title: 'Cancelled',
	filter: TASK_CANCELLED
}];
