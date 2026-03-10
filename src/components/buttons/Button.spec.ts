/// <reference types="mocha" />
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { Block } from '../../core/Block';

class TestButton extends Block {
  constructor(props: any) {
    super('button', {
      ...props,
      events: {
        click: (e: Event) => {
          if (props.onClick && !props.disabled) {
            props.onClick(e);
          }
        }
      }
    });
  }

  protected render(): string {
    return (this.props as any).text || '';
  }
}

describe('Button', () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window as any;
  });

  afterEach(() => {
    dom.window.close();
  });

  it('should create button element', () => {
    const button = new TestButton({ text: 'Click me' });
    button.dispatchComponentDidMount();
    
    const element = button.getContent();
    expect(element).to.exist;
    expect(element.tagName).to.equal('BUTTON');
    expect(element.textContent).to.equal('Click me');
  });

  it('should call onClick when clicked', () => {
    let clicked = false;
    const button = new TestButton({ 
      text: 'Click', 
      onClick: () => { clicked = true; }
    });
    
    button.dispatchComponentDidMount();
    const element = button.getContent();
    
    element.click();
    expect(clicked).to.be.true;
  });

  it('should not call onClick when disabled', () => {
    let clicked = false;
    const button = new TestButton({ 
      text: 'Click', 
      onClick: () => { clicked = true; },
      disabled: true
    });
    
    button.dispatchComponentDidMount();
    const element = button.getContent();
    
    element.click();
    expect(clicked).to.be.false;
  });
});
