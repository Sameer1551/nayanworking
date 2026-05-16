package com.nayaneyecare.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * PHASE 5: Encryption at Rest for sensitive PII/API Keys.
 * 
 * Uses AES-256 encryption to encrypt fields before saving to the database
 * and decrypt them when reading from the database.
 */
@Component
@Converter
public class AttributeEncryptor implements AttributeConverter<String, String> {

    private static final String AES = "AES";
    private static String secretKey;
    private static String oldSecretKey;

    // We use a static setter so the JPA Converter (which is often instantiated 
    // by Hibernate outside the Spring context) can access the injected property.
    @Value("${app.encryption.secret-key:MySuperSecretEncryptionKey123456}")
    public void setSecretKey(String key) {
        AttributeEncryptor.secretKey = key;
    }

    // PHASE 8: Allow Key Rotation by falling back to the old key
    @Value("${app.encryption.old-secret-key:}")
    public void setOldSecretKey(String key) {
        AttributeEncryptor.oldSecretKey = key;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            Cipher cipher = Cipher.getInstance(AES);
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), AES);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            return Base64.getEncoder().encodeToString(cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Error encrypting attribute", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            Cipher cipher = Cipher.getInstance(AES);
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), AES);
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            return new String(cipher.doFinal(Base64.getDecoder().decode(dbData)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            // PHASE 8: If decryption fails with the current key, try the old key (Key Rotation)
            if (oldSecretKey != null && !oldSecretKey.isEmpty()) {
                try {
                    Cipher oldCipher = Cipher.getInstance(AES);
                    SecretKeySpec oldKeySpec = new SecretKeySpec(oldSecretKey.getBytes(StandardCharsets.UTF_8), AES);
                    oldCipher.init(Cipher.DECRYPT_MODE, oldKeySpec);
                    return new String(oldCipher.doFinal(Base64.getDecoder().decode(dbData)), StandardCharsets.UTF_8);
                } catch (Exception ex) {
                    // Fallback to unencrypted
                    return dbData;
                }
            }
            // If decryption fails and no old key is present, it might be legacy unencrypted data. 
            return dbData;
        }
    }
}
