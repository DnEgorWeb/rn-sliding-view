import React from 'react';
import { mount } from 'enzyme';
import { Dimensions, View, Text } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { positions, errors } from '../constants';
import mocks from './__mocks__/constants';
import RNSlidingView from '../index';

describe('RNSlidingView', () => {
  describe('Only default props', () => {
    const changeVisibilityCallback = jest.fn();
    const component = mount(
      <RNSlidingView
        testID="rn-sliding-view"
        componentVisible={false}
        changeVisibilityCallback={changeVisibilityCallback}
      >
        <View>
          <Text>{mocks.loremIpsumText}</Text>
        </View>
      </RNSlidingView>,
    );

    afterAll(() => {
      component.unmount();
    });

    const instance = component.instance();

    it('should match to snapshot', () => {
      expect(component).toMatchSnapshot();
    });

    it('should exist', () => {
      expect(component.findWhere(node => node.prop('testID') === 'rn-sliding-view')).toExist();
    });

    it('should contain required props', () => {
      expect(component).toHaveProp('componentVisible', false);
      expect(component).toHaveProp('changeVisibilityCallback', changeVisibilityCallback);
      expect(component).toHaveProp(
        'children',
        <View>
          <Text>{mocks.loremIpsumText}</Text>
        </View>,
      );
    });

    it('should change visibility', done => {
      const yValue = instance.y._value;
      expect(yValue).toEqual(0);
      component.setProps({ componentVisible: true });
      setTimeout(() => {
        const { height } = Dimensions.get('screen');
        const newYValue = instance.y._value;
        expect(newYValue).toEqual(height / 2);
        done();
      }, 400);
    });

    it('should call toggle, isVertical, getHeight, animate when visibility changed', () => {
      instance.isVertical = jest.fn(() => true);
      instance.getHeight = jest.fn(() => {
        return component.prop('height');
      });
      instance.getWidth = jest.fn(() => component.prop('width'));
      instance.animate = jest.fn();
      instance.toggle = jest.fn(() => {
        const componentVisible = component.prop('componentVisible');
        const isVertical = instance.isVertical();
        const toHiddenStateValue = isVertical ? instance.getHeight() : 0;
        const toVisibleStateValue = isVertical ? 0 : instance.getWidth();
        instance.animate({
          type: isVertical ? 'y' : 'x',
          toValue: componentVisible ? toHiddenStateValue : toVisibleStateValue,
        });
      });
      component.setProps({ componentVisible: false });
      const { height } = Dimensions.get('screen');
      expect(instance.toggle).toHaveBeenCalled();
      expect(instance.isVertical).toHaveBeenCalled();
      expect(instance.getHeight).toHaveBeenCalled();
      expect(instance.getWidth.mock.calls.length).toEqual(0);
      expect(instance.animate).toHaveBeenCalled();
      expect(instance.animate).toHaveBeenCalledWith({ type: 'y', toValue: height / 2 });
    });
  });

  describe('Wrong position passed', () => {
    const component = mount(
      <RNSlidingView
        testID="rn-sliding-view"
        componentVisible={false}
        position="circle"
        changeVisibilityCallback={() => {}}
      >
        <View>
          <Text>{mocks.loremIpsumText}</Text>
        </View>
      </RNSlidingView>,
    );

    afterAll(() => {
      component.unmount();
    });

    const instance = component.instance();

    it('Should throw an error', () => {
      expect(() => {
        instance.toggle();
      }).toThrowError(errors.incorrectPosition);
    });
  });

  describe('Position "top" passed', () => {
    const component = mount(
      <RNSlidingView
        testID="rn-sliding-view"
        componentVisible={false}
        position="top"
        changeVisibilityCallback={() => {}}
      >
        <View>
          <Text>{mocks.loremIpsumText}</Text>
        </View>
      </RNSlidingView>,
    );

    afterAll(() => {
      component.unmount();
    });

    const instance = component.instance();
    const { height } = Dimensions.get('window');

    instance.getHeight = jest.fn(() => {
      const position = component.prop('position');
      if (position === positions.top) return height + getStatusBarHeight();
      if (position === position.bottom) return height;
      throw new Error(errors.incorrectPosition);
    });

    it('Should calculate height properly', () => {
      component.setProps({ componentVisible: true });
      expect(instance.getHeight).toHaveBeenCalled();
      expect(instance.getHeight).toHaveReturnedWith(height + getStatusBarHeight());
    });
  });

  describe('Gesture tests', () => {
    const component = mount(
      <RNSlidingView
        testID="rn-sliding-view"
        componentVisible={false}
        position="top"
        changeVisibilityCallback={() => {}}
      >
        <View>
          <Text>{mocks.loremIpsumText}</Text>
        </View>
      </RNSlidingView>,
    );

    afterAll(() => {
      component.unmount();
    });

    const instance = component.instance();

    const evt = {
      nativeEvent: {
        touches: {
          length: 1,
        },
      },
      touchHistory: {
        numberActiveTouches: 2,
        mostRecentTimeStamp: 2243594,
        touchBank: [{}],
      },
    };
    const gestureState = {
      numberActiveTouches: 2,
    };

    it('should call pan on responder move', () => {
      instance.pan = jest.fn();
      instance.isVertical = jest.fn();
      instance.Responder.onResponderMove(evt, gestureState);
      expect(instance.pan).toHaveBeenCalled();
    });
  });
});
