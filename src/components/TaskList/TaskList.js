import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Error from "../Error/Error";
import Loading from "../Loading/Loading";
import {TASK_ALL} from "../../utils/constants";
import Task from "../Task/Task";
import './task-list.css';

class TaskList extends Component {
    static propTypes = {
        tasks: PropTypes.array,
        loading: PropTypes.bool,
        error: PropTypes.any,
        filter: PropTypes.string,
        onTaskListChange: PropTypes.func
    };

    state = {
        tasks: [],
        loading: true
    };

    componentDidUpdate(prevProps) {
        if (this.props.loading !== prevProps.loading) {
            this.setState({loading: this.props.loading && !this.state.tasks.length});
        }
        if (this.props.tasks !== prevProps.tasks && this.props.tasks) {
            this.setState({tasks: this.props.tasks});
            let {onTaskListChange} = this.props;
            onTaskListChange && onTaskListChange(this.props.tasks);
        }
    }

    render() {
        let {error, filter} = this.props, {
            loading, tasks
        } = this.state;
        return (
            error ? <Error text={error && (typeof error === "string" ? error : JSON.stringify(error))}/> :
                loading ? (<div className="loading-container"><Loading/></div>) :
                    !tasks.length ? (
                        <div className="no-tasks">
                            {filter === TASK_ALL ? 'all your tasks show up here!' :
                                `your ${filter.toLowerCase()} tasks show up here!`}
                        </div>
                    ) : (
                        <div className="task-list">
                            {tasks.map((task, index) => <Task {...task} index={index} key={index}/>)}
                        </div>
                    )
        )
    }
}

export default TaskList;
