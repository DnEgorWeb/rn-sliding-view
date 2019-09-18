// @flow

import React, { Component } from 'react';
import { Animated } from 'react-native';
import { createResponder } from 'react-native-gesture-responder';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { positions, errors } from './constants';
import styles from './styles';

type AnimatedType = {
  _value: number,
  setValue: number => void,
};

type Props = {
  children: Node,
  componentVisible: boolean,
  animationDuration?: number,
  containerStyle?: {},
  position?: string,
  height?: number | string,
  width?: number | string,
  delay?: number,
  disableAutoDragEnd?: boolean,
  disableDrag?: boolean,
  currentPositionX?: AnimatedType,
  currentPositionY?: AnimatedType,
  changeVisibilityCallback?: () => void,
};

/**
 * Represents a class that provides animated View.
 * Required props: componentVisible, children.
 * Props changeVisibilityCallback required if disableDrag prop is false.
 */
export default class SlidingView extends Component<Props> {
  constructor(props) {
    super(props);

    this.Responder = createResponder({
      onStartShouldSetResponder: () => true,
      onStartShouldSetResponderCapture: () => false,
      onMoveShouldSetResponder: () => true,
      onMoveShouldSetResponderCapture: () => true,
      onResponderMove: (evt, gestureState) => {
        this.pan(gestureState);
      },
      onResponderRelease: (evt, gestureState) => {
        this.dragEnd(gestureState);
      },
      onPanResponderTerminationRequest: () => true,
    });
  }

  /**
   * Checks for initial mode (visible or not).
   * If visible - toggles it to visible position.
   */
  componentDidMount() {
    const { componentVisible } = this.props;
    if (componentVisible) {
      this.toggle();
    }
  }

  /**
   * Checks two things:
   * 1) Changing visibility by componentVisible prop.
   * 2) Changing current position when drag'n'drop is handled by user.
   * @param prevProps {Props}
   */
  componentDidUpdate(prevProps) {
    const { componentVisible, disableDrag, currentPositionY, currentPositionX } = this.props;

    if (componentVisible !== prevProps.componentVisible) {
      // toggle visibility
      this.toggle();
    }

    const { x, y } = this;
    if (!disableDrag) return;

    if (currentPositionY !== prevProps.currentPositionY) {
      // handles draggable for y
      y.setValue(currentPositionY);
    }
    if (currentPositionX !== prevProps.currentPositionX) {
      // handles draggable for x
      x.setValue(currentPositionX);
    }
  }

  /**
   * Animted value for horizontal type.
   * @type {Animated.Value}
   */
  x: AnimatedType = new Animated.Value(-wp(100));

  /**
   * Animted value for vertical type.
   * @type {Animated.Value}
   */
  y: AnimatedType = new Animated.Value(0);

  /**
   * Handles pan by user.
   * Checks the mode (vertical / horizontal) and delegates to further functions (handleVerticalMove / handleHorizontalMove).
   * @param gestureState
   */
  pan = gestureState => {
    if (this.isVertical()) {
      return this.handleVerticalMove(gestureState);
    }
    return this.handleHorizontalMove(gestureState);
  };

  /**
   * Handles vertical pans.
   * Updates current position according to gestureState.
   * @param gestureState
   */
  handleVerticalMove = gestureState => {
    const { position, height } = this.props;
    const { bottom } = positions;
    const { moveY, previousMoveY } = gestureState;
    const { y } = this;
    const maxY = height;
    const minY = 0;
    let newY =
      position === bottom ? y._value - (moveY - previousMoveY) : y._value - (previousMoveY - moveY);
    if (y === null) newY = moveY;
    if (newY < minY) {
      newY = minY;
    } else if (newY > maxY) {
      newY = maxY;
    }
    y.setValue(newY);
  };

  /**
   * Handles vertical pans.
   * Updates current position according to gestureState.
   * @param gestureState
   */
  handleHorizontalMove = gestureState => {
    const { position, width } = this.props;
    const { previousMoveX, moveX } = gestureState;
    const { left } = positions;
    const { x } = this;
    const maxX = width;
    const minX = 0;
    let newX =
      position === left ? x._value - (previousMoveX - moveX) : x._value - (moveX - previousMoveX);
    if (newX > minX) {
      newX = minX;
    } else if (newX > maxX) {
      newX = maxX;
    }
    x.setValue(newX);
  };

  /**
   * Checks if disableAutoDragEnd is passed.
   * If it's not - handles finish of drag according to vertical or horizontal mode.
   * @param gestureState
   */
  dragEnd = gestureState => {
    const { disableAutoDragEnd } = this.props;
    if (disableAutoDragEnd) return;
    if (this.isVertical()) this.handleVerticalDragEnd(gestureState);
    else this.handleHorizontalDragEnd(gestureState);
  };

  /**
   * Handles vertical drop (on release event).
   * Checks the direction of movement and either hides the component or returns it to the maximum value.
   * @param gestureState
   * @returns {Number | Function}
   */
  handleVerticalDragEnd = gestureState => {
    const { bottom, top } = positions;
    const { moveY, previousMoveY } = gestureState;
    const { animationDuration, position, changeVisibilityCallback } = this.props;
    const { animateToMax } = this;
    if (
      (position === bottom && moveY > previousMoveY) ||
      (position === top && previousMoveY > moveY)
    ) {
      this.animate({
        type: this.y,
        toValue: 0,
      });
      return setTimeout(changeVisibilityCallback, animationDuration);
    }
    return animateToMax({ type: this.y });
  };

  /**
   * Handles horizontal drop (on release event).
   * Checks the direction of movement and either hides the component or returns it to the maximum value.
   * @param gestureState
   * @returns {Number | Function}
   */
  handleHorizontalDragEnd = gestureState => {
    const { left, right } = positions;
    const { moveX, previousMoveX } = gestureState;
    const { animationDuration, position, width, changeVisibilityCallback } = this.props;
    const { animateToMax } = this;
    if (
      (position === left && moveX < previousMoveX) ||
      (position === right && moveX > previousMoveX)
    ) {
      this.animate({
        type: this.x,
        toValue: -width,
      });
      return setTimeout(changeVisibilityCallback, animationDuration);
    }
    return animateToMax({ type: this.x });
  };

  /**
   * Defines if Slider has vertical position
   * @returns {boolean}
   */
  isVertical = () => {
    const { position } = this.props;
    const { top, bottom } = positions;
    return position === top || position === bottom;
  };

  /**
   * Animates value to it's maximum value (set by props or default props).
   * @param type {string} - x or y, represents horizontal or vertical sliding.
   */
  animateToMax = ({ type }) => {
    const { height, position } = this.props;
    const { bottom, right, top, left } = positions;
    let toValue = null;
    if (position === bottom) toValue = height;
    if (position === top) toValue = height + getStatusBarHeight();
    if (position === left) toValue = 0;
    if (position === right) toValue = 0;
    this.animate({ type, toValue });
  };

  /**
   * Animates to set value.
   * @param type {string} - x or y, represents horizontal or vertical sliding.
   * @param toValue {number}
   */
  animate = ({ type, toValue }: { type: AnimatedType, toValue: number }) => {
    const { animationDuration, delay } = this.props;
    Animated.timing(type, {
      toValue,
      duration: animationDuration,
      delay,
    }).start();
  };

  /**
   * Switches it's state from visible to hidden and vice versa.
   */
  toggle = () => {
    const { componentVisible } = this.props;
    const isVertical = this.isVertical();
    const toHiddenStateValue = isVertical ? this.getHeight() : 0;
    const toVisibleStateValue = isVertical ? 0 : this.getWidth();
    return this.animate({
      type: isVertical ? this.y : this.x,
      toValue: componentVisible ? toHiddenStateValue : toVisibleStateValue,
    });
  };

  /**
   * Gets component's width defined by width prop. Only for horizontal cases.
   * In case of incorrect position throws an error.
   * @returns {number}
   */
  getWidth = () => {
    const { width, position } = this.props;
    if (position === positions.left || position === positions.right) return -width;
    throw new Error(errors.incorrectPosition);
  };

  /**
   * Gets component's height defined by height prop for bottom position and be height + statusbar for top one.
   * In case of incorrect position throws an error.
   * @returns {*}
   */
  getHeight = () => {
    const { height, position } = this.props;
    if (position === positions.top) return height + getStatusBarHeight();
    if (position === positions.bottom) return height;
    throw new Error(errors.incorrectPosition);
  };

  /**
   * Gets styles for the component based on position, height and width prop.
   * @returns {*[]}
   */
  getStyles = () => {
    const { position, width, height, containerStyle } = this.props;
    const { x, y } = this;
    const { left, right, bottom } = positions;
    const { containerVertical, containerHorizontal } = styles;
    const defaultStyles = this.isVertical() ? containerVertical : containerHorizontal;
    let positionStyles = null;
    if (position === left) positionStyles = { left: 0, marginLeft: x, width };
    else if (position === right) positionStyles = { right: 0, marginRight: x, width };
    else if (position === bottom) positionStyles = { bottom: -height, marginBottom: y, height };
    else positionStyles = { top: -height - getStatusBarHeight(), marginTop: y, height };
    return [defaultStyles, positionStyles, containerStyle];
  };

  render() {
    const { children, disableDrag } = this.props;
    const responders = disableDrag ? {} : this.Responder;
    return (
      <Animated.View {...responders} style={this.getStyles()}>
        {children}
      </Animated.View>
    );
  }
}

SlidingView.defaultProps = {
  animationDuration: 300,
  containerStyle: {},
  position: positions.bottom,
  delay: 0,
  height: hp(50),
  width: wp(100),
  currentPositionX: null,
  currentPositionY: null,
  disableAutoDragEnd: false,
  disableDrag: false,
  changeVisibilityCallback: () => {},
};
