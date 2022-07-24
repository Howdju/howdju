import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';

const ShareDataItemPreview = ({item}) => {
  const {value, mimeType, role} = item;
  return (
    <View>
      <Text style={styles.mimeTypeText} disabled={true}>{mimeType} ({role ?? 'None'})</Text>
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
      {mimeType.startsWith('application/pdf') && (
        <Text disabled={true}>{value}</Text>
      )}
      {mimeType.startsWith('audio/') && (
        <Text disabled={true}>{value}</Text>
      )}
      {mimeType.startsWith('video/') && (
        <Text disabled={true}>{value}</Text>
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