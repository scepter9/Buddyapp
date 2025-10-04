import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
const {width, height}=Dimensions.get('window')
function ViewImage({route}) {
    const {imagevalue}=route.params
    return (
        <View style={viewerStyles.container}>
      <Image 
        source={{ uri: imagevalue }} 
        style={viewerStyles.fullImage} 
        resizeMode="contain" // Ensures the entire image is visible
      />
    </View>
    );
}

const viewerStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent', // Typically a black background for image viewing
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullImage: {
      width: width,
      height: '90%',
    },
  });

export default ViewImage;