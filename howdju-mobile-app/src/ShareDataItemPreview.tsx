import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';

const ShareDataItemPreview = ({item}) => {
  const {mimeType, value} = item;
  return (
    <View>
      <Text style={styles.mimeTypeText} disabled={true}>{mimeType}</Text>
      {mimeType.startsWith('text/') && (
        <Text disabled={true}>{value}</Text>
      )}
      {mimeType.startsWith('image/') && (
        <Image
          style={styles.image}
          resizeMode="contain"
          source={{uri: value}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mimeTypeText: {
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
  },
});

export default ShareDataItemPreview