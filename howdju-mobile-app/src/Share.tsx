import React, {useEffect, useState} from 'react';
import {FlatList, View, Text, Pressable, StyleSheet} from 'react-native';
import {ShareMenuReactView} from 'react-native-share-menu';
import ShareDataItemPreview from './ShareDataItemPreview';

const Button = ({onPress, title, style}) => (
  <Pressable onPress={onPress}>
    <Text style={[{fontSize: 16, margin: 16}, style]}>{title}</Text>
  </Pressable>
);

const Share = () => {
  const [shareData, setShareData] = useState({items:[]});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    ShareMenuReactView.data()
      .then(({data}) => {
        setShareData(data);
      })
      .catch(console.error);
  }, []);

  console.log({shareData})
  const shareItems = shareData?.items;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="Dismiss"
          onPress={() => {
            ShareMenuReactView.dismissExtension();
          }}
          style={styles.destructive}
        />
        <Button
          title={sending ? 'Sending...' : 'Send'}
          onPress={() => {
            setSending(true);

            setTimeout(() => {
              ShareMenuReactView.dismissExtension();
            }, 3000);
          }}
          disabled={sending}
          style={sending ? styles.sending : styles.send}
        />
      </View>
      <FlatList 
        data={shareItems}
        renderItem={({item}) => (
          <ShareDataItemPreview item={item} />
        )}>
      </FlatList>
      <View style={styles.buttonGroup}>
        <Button
          title="Dismiss with Error"
          onPress={() => {
            ShareMenuReactView.dismissExtension('Dismissed with error');
          }}
          style={styles.destructive}
        />
        <Button
          title="Continue In App"
          onPress={() => {
            ShareMenuReactView.continueInApp();
          }}
        />
        <Button
          title="Continue In App With Extra Data"
          onPress={() => {
            ShareMenuReactView.continueInApp({hello: 'from the other side'});
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  destructive: {
    color: 'red',
  },
  send: {
    color: 'blue',
  },
  sending: {
    color: 'grey',
  },
  buttonGroup: {
    alignItems: 'center',
  },
});

export default Share;
