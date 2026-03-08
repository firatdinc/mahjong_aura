import React from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity, Modal} from 'react-native';
import {CPTile} from '../../types/columnPush';
import {getImageForTile} from '../../utils/columnPushEmoji';
import {useLanguage} from '../../i18n/useLanguage';
import {ms, modalWidth} from '../../utils/scaling';

interface FinalPickOverlayProps {
  visible: boolean;
  centerTiles: CPTile[];
  onPick: (index: number) => void;
}

export const FinalPickOverlay: React.FC<FinalPickOverlayProps> = ({
  visible,
  centerTiles,
  onPick,
}) => {
  const {t} = useLanguage();
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{t.cpFinalPick}</Text>
          <Text style={styles.subtitle}>{t.cpPickTile}</Text>
          <View style={styles.tilesRow}>
            {centerTiles.map((tile, index) => (
              <TouchableOpacity
                key={tile.id}
                style={styles.tile}
                onPress={() => onPick(index)}
                activeOpacity={0.7}>
                <Image
                  source={getImageForTile(tile)}
                  style={styles.tileImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#34656D',
    borderRadius: 20,
    padding: ms(28),
    width: modalWidth(300),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A5450',
  },
  title: {
    fontSize: ms(22),
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8AABA5',
    marginBottom: 20,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  tile: {
    width: ms(64),
    height: ms(80),
    borderRadius: ms(10),
    backgroundColor: '#FAF8F1',
    borderWidth: 2,
    borderColor: '#D5C89A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tileImage: {
    width: ms(40),
    height: ms(40),
  },
});
