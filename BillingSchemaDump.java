import java.sql.*;
public class BillingSchemaDump {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:mysql://localhost:3306/nayan-db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    try (Connection conn = DriverManager.getConnection(url, "root", "root")) {
      try (Statement st = conn.createStatement()) {
        for (String table : new String[]{"billing_products", "billing_records"}) {
          try (ResultSet rs = st.executeQuery("SHOW CREATE TABLE " + table)) {
            if (rs.next()) {
              System.out.println("=== " + table + " ===");
              System.out.println(rs.getString(2));
            }
          }
        }
      }
    }
  }
}
