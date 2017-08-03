/* global setImmediate */

/**
 * react-native-swiper
 * @author leecade<leecade@163.com>
 */
import React, {Component, PropTypes} from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  ViewPagerAndroid,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import {Pagination} from './Pagination';
import {Buttons} from './Buttons';

const {width, height} = Dimensions.get('window');

class Swiper extends Component {
  /**
   * Props Validation
   * @type {Object}
   */
  static propTypes = {
    ...ScrollView.propTypes,

    showsPagination: PropTypes.bool,
    renderPagination: PropTypes.func,
    showsButtons: PropTypes.bool,
    renderButtons: PropTypes.func,

    loadMinimal: PropTypes.bool,
    loadMinimalSize: PropTypes.number,
    loadMinimalLoader: PropTypes.element,
    loop: PropTypes.bool,
    autoPlay: PropTypes.bool,
    autoPlayTimeout: PropTypes.number,
    autoPlayDirection: PropTypes.bool,
    index: PropTypes.number,
  };

  /**
   * Default props
   * @return {object} props
   * @see http://facebook.github.io/react-native/docs/scrollview.html
   */
  static defaultProps = {
    index: 0,
    horizontal: true,
    pagingEnabled: true,
    showsHorizontalScrollIndicator: false,
    showsVerticalScrollIndicator: false,
    bounces: false,
    scrollsToTop: false,
    removeClippedSubviews: true,
    automaticallyAdjustContentInsets: false,
    showsPagination: true,
    showsButtons: false,
    loop: true,
    loadMinimal: false,
    loadMinimalSize: 1,
    autoPlay: false,
    autoPlayTimeout: 2.5,
    autoPlayDirection: true,
    scrollEventThrottle: 16,
  };

  /**
   * Init states
   * @return {object} states
   */
  state = this.initState(this.props, true);

  componentWillReceiveProps(nextProps) {
    const sizeChanged = (nextProps.width || width) !== this.state.width ||
      (nextProps.height || height) !== this.state.height;

    if (!nextProps.autoPlay) {
      clearTimeout(this.autoPlayTimer);
    }
    this.setState(this.initState(nextProps, sizeChanged));
  }

  componentDidMount() {
    this.autoPlay();
  }

  componentWillUnmount() {
    clearTimeout(this.autoPlayTimer);
    clearTimeout(this.loopJumpTimer);
  }

  autoPlayTimer = null;
  loopJumpTimer = null;
  offset = 0;
  isScrolling = false;

  initState(props, sizeChanged) {
    // set the current state
    const state = this.state || {};

    this.isScrolling = false;
    this.offset = 0;

    const total = props.children.length || 1;

    const totalChanged = state.total !== total;
    const boundedIndex = total > 1 ? Math.min(props.index, total - 1) : 0;
    const index = totalChanged ? boundedIndex : state.index;

    // Default: horizontal
    const newWidth = props.width || width;
    const newHeight = props.height || height;

    if (total > 1) {
      const startIndex = index + (props.loop ? 1 : 0);
      const step = props.horizontal ? newWidth : newHeight;
      this.offset = startIndex * step;
    }

    return {
      total,
      index,
      visualIndex: state.visualIndex || 0,
      autoPlayEnd: false,
      loopJump: false,
      width: newWidth,
      height: newHeight,
      // only update the offset in state if needed, updating offset while swiping
      // causes some bad jumping / stuttering
      offset: totalChanged || sizeChanged ? this.offset : state.offset,
    };
  }

  // include private vars with state
  fullState() {
    return Object.assign({}, this.state, {isScrolling: this.isScrolling, offset: this.offset});
  }

  loopJump() {
    const {loop} = this.props;
    const {loopJump, index} = this.state;

    if (!loopJump) {
      return;
    }

    if (this.scrollView && this.scrollView.setPageWithoutAnimation) {
      const i = index + (loop ? 1 : 0);
      this.loopJumpTimer = setTimeout(() => this.scrollView.setPageWithoutAnimation(i), 50);
    }
  }

  /**
   * Automatic rolling
   */
  autoPlay() {
    const {total, index, autoPlayEnd} = this.state;
    const {autoPlay, loop, autoPlayTimeout, autoPlayDirection} = this.props;

    if (this.isScrolling || total < 2 || !autoPlay || autoPlayEnd) {
      return;
    }

    clearTimeout(this.autoPlayTimer);

    this.autoPlayTimer = setTimeout(() => {
      if (!loop && (autoPlayDirection ? index === total - 1 : index === 0)) {
        this.setState({autoPlayEnd: true});
      } else {
        this.scrollBy(autoPlayDirection ? 1 : -1);
      }
    }, autoPlayTimeout * 1000);
  }

  /**
   * Scroll begin handle
   * @param  {object} e native event
   */
  onScrollBegin = (e) => {
    const {onScrollBeginDrag} = this.props;

    this.isScrolling = true;

    onScrollBeginDrag && onScrollBeginDrag(e, this.fullState(), this);
  };

  /**
   * Scroll end handle
   * @param  {object} e native event
   */
  onScrollEnd = (e) => {
    const {nativeEvent: {contentOffset, position}} = e;
    const {width, height} = this.state;
    const {onMomentumScrollEnd, horizontal} = this.props;

    this.isScrolling = false;

    let modifiedContentOffset;
    // making our events coming from android compatible to updateIndex logic
    if (contentOffset) {
      modifiedContentOffset = horizontal ? contentOffset.x : contentOffset.y;
    } else {
      modifiedContentOffset = horizontal ? position * width : position * height;
    }

    this.updateIndex(modifiedContentOffset, () => {
      this.autoPlay();
      this.loopJump();

      // if `onMomentumScrollEnd` registered will be called here
      onMomentumScrollEnd && onMomentumScrollEnd(e, this.fullState(), this);
    });
  };

  /*
   * Drag end handle
   * @param {object} e native event
   */
  onScrollEndDrag = ({nativeEvent: {contentOffset}}) => {
    const {horizontal} = this.props;
    const {index, total} = this.state;
    const previousOffset = this.offset;
    const newOffset = horizontal ? contentOffset.x : contentOffset.y;

    if (previousOffset === newOffset && (index === 0 || index === total - 1)) {
      this.isScrolling = false;
    }
  };

  /*
   * Handle onScroll events and maintain the visualIndex
   * @param {object} e native event
   */
  onScroll = ({nativeEvent: {contentOffset}}) => {
    const {loop, horizontal} = this.props;
    const {width, height, total, visualIndex} = this.state;
    const step = horizontal ? width : height;
    const pos = horizontal ? contentOffset.x : contentOffset.y;

    let newVisualIndex = Math.floor((pos + (step / 2)) / step);

    // Looping index is offset by 1, needs to be bounded
    if (loop) {
      newVisualIndex--;

      if (newVisualIndex < 0) {
        newVisualIndex = total - 1;
      } else if (newVisualIndex >= total) {
        newVisualIndex = 0;
      }
    }

    if (newVisualIndex !== visualIndex) {
      this.setState({visualIndex: newVisualIndex});
    }
  };

  /**
   * Update index after scroll
   * @param  {object} offset content offset
   * @param  {func} callback
   */
  updateIndex(offset, cb) {
    const {index, width, height, total} = this.state;
    const {loop, horizontal} = this.props;

    const diff = offset - this.offset;

    // Do nothing if offset no change.
    if (!diff) {
      return;
    }

    const step = horizontal ? width : height;

    // Note: if touch very very quickly and continuous,
    // the variation of `index` more than 1.
    // parseInt() ensures it's always an integer
    let newIndex = parseInt(index + Math.round(diff / step), 10);
    let newOffset = offset;
    let loopJump = false;

    if (loop) {
      if (newIndex <= -1) {
        newIndex = total - 1;
        newOffset = step * total;
        loopJump = true;
      } else if (newIndex >= total) {
        newIndex = 0;
        newOffset = step;
        loopJump = true;
      }
    }

    this.offset = newOffset;

    const newState = {
      index: newIndex,
      visualIndex: newIndex,
      loopJump,
    };

    // only update offset in state if loopJump is true
    if (loopJump) {
      // when swiping to the beginning of a looping set for the third time,
      // the new offset will be the same as the last one set in state.
      // Setting the offset to the same thing will not do anything,
      // so we increment it by 1 then immediately set it to what it should be,
      // after render.
      if (newOffset === this.state.offset) {
        newState.offset = newOffset + 1;
        this.setState(newState, () => {
          this.setState({offset: newOffset}, cb);
        });
      } else {
        newState.offset = newOffset;
        this.setState(newState, cb);
      }
    } else {
      this.setState(newState, cb);
    }
  }

  /**
   * Scroll by index
   * @param  {number} indexOffset offset index
   * @param  {bool} animated
   */

  scrollBy = (indexOffset, animated = true) => {
    const {horizontal, loop} = this.props;
    const {index, total} = this.state;

    if (this.isScrolling || total < 2) {
      return;
    }

    const state = this.state;
    const diff = (loop ? 1 : 0) + indexOffset + index;
    const x = horizontal ? diff * state.width : 0;
    const y = horizontal ? 0 : diff * state.height;

    if (Platform.OS === 'android') {
      this.scrollView && this.scrollView[animated ? 'setPage' : 'setPageWithoutAnimation'](diff);
    } else {
      this.scrollView && this.scrollView.scrollTo({x, y, animated});
    }

    // update scroll state
    this.isScrolling = true;

    this.setState({autoPlayEnd: false});

    // trigger onScrollEnd manually in android
    if (!animated || Platform.OS === 'android') {
      setImmediate(() => this.onScrollEnd({nativeEvent: {position: diff}}));
    }
  };

  scrollForward = () => this.scrollBy(1);
  scrollBackward = () => this.scrollBy(-1);

  scrollViewPropOverrides() {
    /*
     const scrollResponders = [
     'onMomentumScrollBegin',
     'onTouchStartCapture',
     'onTouchStart',
     'onTouchEnd',
     'onResponderRelease',
     ]
     */
    return Object.entries(this.props).reduce((overrides, [key, value]) => {
      if (typeof value === 'function' &&
        key !== 'onMomentumScrollEnd' &&
        key !== 'renderPagination' &&
        key !== 'onScrollBeginDrag'
      ) {
        overrides[key] = (e) => value(e, this.fullState(), this);
      }
    }, {});
  }

  /**
   * Render pagination
   * @return {object} react-dom
   */
  renderPagination() {
    const {total, index, visualIndex} = this.state;
    const {showsPagination, renderPagination} = this.props;

    if (showsPagination) {
      if (renderPagination) {
        return renderPagination({index, visualIndex, total, context: this});
      }

      return <Pagination index={visualIndex} total={total} />;
    }
  }

  renderButtons() {
    const {loop, showsButtons, renderButtons} = this.props;
    const {index, total} = this.state;

    if (showsButtons) {
      const buttonProps = {index, total, loop, scrollBackward: this.scrollBackward, scrollForward: this.scrollForward};
      if (renderButtons) {
        return renderButtons({...buttonProps, context: this});
      }
      return <Buttons {...buttonProps} />;
    }
  }

  buildPages() {
    const {width, height, index, total} = this.state;
    const {children, loop, loadMinimal, loadMinimalSize, loadMinimalLoader} = this.props;

    const loopVal = loop ? 1 : 0;

    const dimensions = {width, height};
    const pageStyle = [dimensions, styles.slide];
    const pageStyleLoading = [dimensions, styles.pageLoading];

    if (total <= 1) {
      return [<View style={pageStyle} key={0}>{children}</View>];
    }

    // Re-design a loop model for avoid img flickering
    const pageKey = Object.keys(children);
    if (loop) {
      pageKey.unshift(String(total - 1));
      pageKey.push('0');
    }

    return pageKey.map((page, i) => {
      if (loadMinimal) {
        if (i >= (index + loopVal - loadMinimalSize) &&
          i <= (index + loopVal + loadMinimalSize)) {
          return <View style={pageStyle} key={i}>{children[page]}</View>;
        }
        return (
          <View style={pageStyleLoading} key={`loading-${i}`}>
            {loadMinimalLoader ? loadMinimalLoader : <ActivityIndicator />}
          </View>
        );
      }

      return <View style={pageStyle} key={i}>{children[page]}</View>;
    });
  }

  setScrollView = (element) => {
    this.scrollView = element;
  };

  renderScrollView() {
    const pages = this.buildPages();

    const {style, ...props} = this.props;
    const {offset, index} = this.state;

    const contentOffset = {
      x: this.props.horizontal ? offset : 0,
      y: this.props.horizontal ? 0 : offset,
    };

    if (Platform.OS === 'ios') {
      return (
        <ScrollView ref={this.setScrollView}
                    {...props}
                    {...this.scrollViewPropOverrides()}
                    contentContainerStyle={[styles.wrapper, style]}
                    contentOffset={contentOffset}
                    onScrollBeginDrag={this.onScrollBegin}
                    onMomentumScrollEnd={this.onScrollEnd}
                    onScrollEndDrag={this.onScrollEndDrag}
                    onScroll={this.onScroll}>
          {pages}
        </ScrollView>
      );
    }
    return (
      <ViewPagerAndroid ref="scrollView"
                        {...this.props}
                        initialPage={this.props.loop ? index + 1 : index}
                        onPageSelected={this.onScrollEnd}
                        style={{flex: 1}}>
        {pages}
      </ViewPagerAndroid>
    );
  }

  /**
   * Default render
   * @return {object} react node
   */
  render() {
    const {width, height} = this.state;

    return (
      <View style={[styles.container, {width, height}]}>
        {this.renderScrollView()}
        {this.renderPagination()}
        {this.renderButtons()}
      </View>
    );
  }
}

export default Swiper;

/**
 * Default styles
 * @type {StyleSheetPropType}
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    position: 'relative'
  },

  wrapper: {
    backgroundColor: 'transparent'
  },

  slide: {
    backgroundColor: 'transparent'
  },

  pageLoading: {
    justifyContent: 'center',
    alignItems: 'center'
  },
});
