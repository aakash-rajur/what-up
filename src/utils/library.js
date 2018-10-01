import React from "react";
import {Mutation} from 'react-apollo';
import {ON_NOTIFICATION, TASK_ALL, TASK_CANCELLED, TASK_COMPLETED, TASK_CREATED, TASKS_CHANGED} from "./constants";

export function promiseSetState(context) {
	return newState => new Promise(resolve =>
		context.setState(newState, resolve)
	);
}

export function wait(delay, cb, ...args) {
	let timeout = null,
		promise = new Promise(resolve => {
			timeout = setTimeout(async () =>
					resolve(cb && await cb(...(args || []))),
				delay
			);
		});
	promise.cancel = () => clearTimeout(timeout);
	return promise;
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
	text: 'All',
	title: 'View All Tasks',
	shortText: 'A',
	filter: TASK_ALL
}, {
	text: 'Active',
	title: 'View Active Tasks',
	shortText: '◯',
	filter: TASK_CREATED
}, {
	text: 'Completed',
	title: 'View Completed Tasks',
	shortText: '✔',
	filter: TASK_COMPLETED
}, {
	text: 'Cancelled',
	title: 'View Cancelled Tasks',
	shortText: '✗',
	filter: TASK_CANCELLED
}];

export function parseCookie() {
	let cookies = document.cookie.split(';');
	return cookies.reduce((parsed, each) => {
		let [key, value = ''] = each.split('=');
		if (key) parsed[key.trim()] = value.trim();
		return parsed;
	}, {});
}

export function parseNotification(cb) {
	return ({data}) => {
		const {
			[ON_NOTIFICATION]: {
				action,
				data: payload,
				timestamp
			}
		} = data;
		return cb({
			action,
			timestamp,
			data: JSON.parse(payload)
		});
	};
}

export function parseTasksChanged(cb) {
	return ({data}) => {
		const {[TASKS_CHANGED]: stat} = data;
		return cb(stat);
	};
}

export function graphQLSubscribe(client, cb, query, variables) {
	client.subscribe({
		query,
		variables,
		shouldResubscribe: true
	}).subscribe({next: cb, error: console.error});
}