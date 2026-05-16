import java.sql.*;
public class BillingFinalCheck {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:mysql://localhost:3306/nayan-db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    try (Connection conn = DriverManager.getConnection(url, "root", "root")) {
      try (Statement st = conn.createStatement()) {
        try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM billing_records")) { rs.next(); System.out.println("billing_records=" + rs.getInt(1)); }
        try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM billing_products")) { rs.next(); System.out.println("billing_products=" + rs.getInt(1)); }
        try (ResultSet rs = st.executeQuery("SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA='nayan-db' AND TABLE_NAME='billing_records'")) { if (rs.next()) System.out.println("billing_records next_id=" + rs.getLong(1)); }
      }
    }
  }
}
