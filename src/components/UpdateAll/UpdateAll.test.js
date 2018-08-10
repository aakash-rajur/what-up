import React from 'react';
import CHEVRON_DOWN_ICON from "../../assets/chevron-down.svg";
import {UpdateAll} from './UpdateAll';

describe('UpdateAll component', () => {
    let className = 'lorem',
        onUpdateAll = stub(),
        component = shallow(<UpdateAll className={className} updateAll={onUpdateAll}/>);

    it('should render', () => {
        expect(component.find('img.lorem').exists())
            .toBe(true);
    });

    it('image source', () =>
        expect(component.prop('src'))
            .toBe(CHEVRON_DOWN_ICON)
    );

    it('should invoke onUpdateAll', () => {
        component.simulate('click');
        expect(onUpdateAll.called).toBe(true);
        expect(onUpdateAll.callCount).toBe(1);
    });

    it('match snapshot', () => expect(component).toMatchSnapshot());
});
