import React from 'react';
import Footer from './Footer';

describe('Footer component', () => {
    let component = shallow(<Footer/>);

    it('should render', () => {
        expect(component.find('div.documentation').exists())
            .toBe(true);
    });

    it('dom tree integrity', () => [
            {tag: 'em'}, {tag: 'br'}, {text: 'Created by '},
            {tag: 'a'}, {tag: 'br'}, {text: 'Inspired by '},
            {tag: 'a'}, {tag: 'br'}
        ].forEach(({tag, text}, i) => {
            let child = component.childAt(i);
            expect(tag ? child.type() : child.text())
                .toBe(tag || text)
        })
    );

    it('match snapshot', () => expect(component).toMatchSnapshot());
});
