import React from 'react';
import Loading from './Loading';

describe('Loading component', () => {
    let className = 'additional',
        component = shallow(<Loading className={className}/>);

    it('should render', () => {
        expect(component.find('div.loading').exists())
            .toBe(true);
    });

    it('check props and classNames', () => {
        expect(component.find('div').hasClass('loading')).toBe(true);
        expect(component.find('div').hasClass(className)).toBe(true);
    });

    it('match snapshot', () => {
        expect(component).toMatchSnapshot();
    });
});
