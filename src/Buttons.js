/**
 * react-native-swiper
 * @author leecade<leecade@163.com>
 * @meddler martinshuttleworth<martin@thoughtmachine.net>
 */

import React, {PropTypes} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

export const Buttons = ({index, total, loop, scrollBackward, scrollForward, buttonWrapperStyle}) => {
  const showNextButton = loop || index !== total - 1;
  const showPrevButton = loop || index !== 0;

  return (
    <View pointerEvents="box-none" style={[styles.buttonWrapper, buttonWrapperStyle]}>
      {showPrevButton ? (
          <TouchableOpacity onPress={scrollBackward}>
            <View>
              <Text style={styles.buttonText}>‹</Text>
            </View>
          </TouchableOpacity>
        ) : <View /> }
      {showNextButton ? (
          <TouchableOpacity onPress={scrollForward}>
            <View>
              <Text style={styles.buttonText}>›</Text>
            </View>
          </TouchableOpacity>
        ) : <View /> }
    </View>
  );
};

Buttons.propTypes = {
  total: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,

  scrollBackward: PropTypes.func,
  scrollForward: PropTypes.func,

  loop: PropTypes.bool,
  buttonWrapperStyle: View.propTypes.style
};

const styles = StyleSheet.create({
  buttonWrapper: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  buttonText: {
    fontSize: 50,
    color: '#007aff',
    fontFamily: 'Arial'
  },
});
