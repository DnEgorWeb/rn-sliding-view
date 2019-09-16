import { StyleSheet } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

export default StyleSheet.create({
  containerVertical: {
    width: wp(100),
    backgroundColor: '#fff',
    position: 'absolute',
    overflow: 'hidden',
  },
  containerHorizontal: {
    height: hp(100),
    backgroundColor: '#fff',
    position: 'absolute',
    overflow: 'hidden',
  },
});
