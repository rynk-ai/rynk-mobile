import React, { useState } from 'react';
import { View, Image, StyleSheet, ScrollView, TouchableOpacity, Text, Dimensions, Modal } from 'react-native';
import { theme } from '../../lib/theme';
import { X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export interface SourceImage {
  url: string;
  sourceUrl: string;
  sourceTitle: string;
}

interface SourceImagesProps {
  images: SourceImage[];
  onImagePress?: (image: SourceImage) => void;
}

export function SourceImages({ images, onImagePress }: SourceImagesProps) {
  const [selectedImage, setSelectedImage] = useState<SourceImage | null>(null);

  if (!images || images.length === 0) return null;

  const handlePress = (img: SourceImage) => {
    if (onImagePress) {
      onImagePress(img);
    } else {
      setSelectedImage(img);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((img, index) => (
          <TouchableOpacity 
            key={`${img.url}-${index}`}
            style={styles.imageCard}
            onPress={() => handlePress(img)}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: img.url }} 
              style={styles.image} 
              resizeMode="cover"
            />
            {img.sourceTitle && (
              <View style={styles.captionOverlay}>
                 <Text style={styles.captionText} numberOfLines={1}>{img.sourceTitle}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Simple Image Modal for preview if no custom handler */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setSelectedImage(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X color="#fff" size={24} />
          </TouchableOpacity>
          
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage.url }} 
              style={styles.fullScreenImage} 
              resizeMode="contain"
            />
          )}

          {selectedImage?.sourceTitle && (
            <View style={styles.modalCaption}>
              <Text style={styles.modalCaptionText}>{selectedImage.sourceTitle}</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12, // Space before text
  },
  scrollContent: {
    paddingRight: 16, // Padding for end of list
    gap: 8,
  },
  imageCard: {
    width: 200,
    height: 120,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
    // borderRadius: 0, // Swiss style
  },
  image: {
    width: '100%',
    height: '100%',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  captionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  fullScreenImage: {
    width: width,
    height: '80%',
  },
  modalCaption: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  modalCaptionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  }
});
