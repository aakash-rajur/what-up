const {
    REACT_APP_TASK_CREATED: TASK_CREATED,
    REACT_APP_TASK_COMPLETED: TASK_COMPLETED,
    REACT_APP_TASK_CANCELLED: TASK_CANCELLED,
    REACT_APP_TASK_ALL: TASK_ALL,
} = process.env;

function getTimestamp() {
    return Date.now().toString(10);
}

function createPublisher(pubsub) {
    return (event, data = {}) => {
        pubsub.publish(event, {
            tasksChanged: {
                ...data,
                timestamp: getTimestamp()
            }
        })
    }
}

function getStats(tasks = []) {
    return tasks.reduce((acc, {status}) => {
        if (status in acc) acc[status] += 1;
        return acc;
    }, {
        [TASK_CREATED]: 0,
        [TASK_COMPLETED]: 0,
        [TASK_CANCELLED]: 0,
        [TASK_ALL]: tasks.length
    });
}

function findTask(tasks = [], id) {
    let task = tasks.find(({id: ID}) => ID === id);
    if (!task) throw new Error(`task with ${id} doesn't exist`);
    return task;
}

module.exports = {
    TASK_CREATED,
    TASK_COMPLETED,
    TASK_CANCELLED,
    TASK_ALL,
    getTimestamp,
    findTask,
    createPublisher,
    getStats,
};