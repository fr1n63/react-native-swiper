/**
 * react-native-swiper
 * @author leecade<leecade@163.com>
 */

import React, {PropTypes} from 'react';
import {View, StyleSheet} from 'react-native';

export const Pagination = ({
  total, index, horizontal, dot, dotColor, dotStyle, activeDot, activeDotColor, activeDotStyle, paginationStyle}
) => {
  // By default, dots only show when `total` > 1
  if (total < 2) {
    return null;
  }

  const dots = [];

  const ActiveDot = activeDot || <View style={[styles.dot, {backgroundColor: activeDotColor}, activeDotStyle]} />;
  const Dot = dot || <View style={[styles.dot, {backgroundColor: dotColor}, dotStyle]} />;

  for (let i = 0; i < total; i++) {
    dots.push(i === index
      ? React.cloneElement(ActiveDot, {key: i})
      : React.cloneElement(Dot, {key: i})
    );
  }

  return (
    <View pointerEvents="none"
          style={[
            horizontal ? styles.pagination_x : styles.pagination_y,
            paginationStyle
          ]}>
      {dots}
    </View>
  );
};

Pagination.propTypes = {
  total: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,

  horizontal: PropTypes.bool,
  dotStyle: PropTypes.object,
  activeDotStyle: PropTypes.object,
  dot: PropTypes.node,
  dotColor: PropTypes.string,
  activeDot: PropTypes.node,
  activeDotColor: PropTypes.string,
  paginationStyle: View.propTypes.style
};

Pagination.defaultProps = {
  horizontal: true,
  activeDotColor: '#007aff',
  dotColor: 'rgba(0,0,0,.2)',
};

/**
 * Default styles
 * @type {StyleSheetPropType}
 */
const styles = StyleSheet.create({
  pagination_x: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },

  pagination_y: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
    marginTop: 3,
    marginBottom: 3
  }
});
