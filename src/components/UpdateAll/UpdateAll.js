import PropTypes from 'prop-types';
import React from 'react';
import CHEVRON_DOWN_ICON from "../../assets/chevron-down.svg";
import {withUpdateAll} from "../../utils/apollo";

export function UpdateAll({className, updateAll}) {
	return (
		<img src={CHEVRON_DOWN_ICON} alt="toggle-all"
		     className={className} onClick={updateAll}
		     title='Update All'/>
	);
}

UpdateAll.propTypes = {
	className: PropTypes.string,
	nextStatus: PropTypes.string,
};

export default withUpdateAll(UpdateAll);
