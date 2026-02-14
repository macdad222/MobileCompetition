#!/bin/bash
# smb-admin.sh — Quick admin tools for SMB Market Intel
# Usage: ./smb-admin.sh [command]

DB_CMD="docker exec mobilecompetition-db-1 psql -U postgres -d smb_intelligence -c"

case "${1:-help}" in

  users)
    echo "📋 Registered Users"
    echo "===================="
    $DB_CMD "SELECT name, email, \"createdAt\"::date as registered FROM \"User\" ORDER BY \"createdAt\";"
    echo ""
    $DB_CMD "SELECT COUNT(*) as total_users FROM \"User\";"
    ;;

  activity)
    echo "📊 User Activity (Refreshes & Analyses)"
    echo "=========================================="
    $DB_CMD "
      SELECT u.name, u.email,
             COUNT(DISTINCT r.id) as data_refreshes,
             COUNT(DISTINCT i.id) as analyses_generated,
             MAX(r.\"createdAt\")::timestamp(0) as last_refresh,
             MAX(i.\"generatedAt\")::timestamp(0) as last_analysis
      FROM \"User\" u
      LEFT JOIN \"RefreshJob\" r ON r.\"userId\" = u.id
      LEFT JOIN \"StoredInsight\" i ON i.\"userId\" = u.id
      GROUP BY u.id, u.name, u.email
      ORDER BY GREATEST(MAX(r.\"createdAt\"), MAX(i.\"generatedAt\")) DESC NULLS LAST;
    "
    ;;

  signups)
    echo "📈 Signups by Day"
    echo "=================="
    $DB_CMD "
      SELECT \"createdAt\"::date as day, COUNT(*) as signups
      FROM \"User\"
      GROUP BY \"createdAt\"::date
      ORDER BY day DESC;
    "
    ;;

  insights)
    echo "🧠 AI Analyses Generated"
    echo "========================="
    $DB_CMD "
      SELECT \"insightType\", COUNT(*) as count, MAX(\"generatedAt\")::timestamp(0) as latest
      FROM \"StoredInsight\"
      GROUP BY \"insightType\"
      ORDER BY \"insightType\";
    "
    ;;

  requests)
    echo "💡 Development Requests"
    echo "========================"
    $DB_CMD "
      SELECT d.title, d.status, u.name as requested_by, d.\"createdAt\"::timestamp(0) as submitted
      FROM \"DevelopmentRequest\" d
      JOIN \"User\" u ON u.id = d.\"userId\"
      ORDER BY d.\"createdAt\" DESC;
    "
    ;;

  data)
    echo "📦 Data Status"
    echo "==============="
    $DB_CMD "
      SELECT p.\"displayName\", COUNT(o.id) as offers, MAX(o.\"lastSeenAt\")::timestamp(0) as last_updated
      FROM \"Provider\" p
      LEFT JOIN \"Offer\" o ON o.\"providerId\" = p.id AND o.\"isActive\" = true
      WHERE p.\"isActive\" = true
      GROUP BY p.id, p.\"displayName\"
      ORDER BY p.\"priorityRank\";
    "
    ;;

  stats)
    echo "🏠 Quick Stats"
    echo "==============="
    $DB_CMD "
      SELECT
        (SELECT COUNT(*) FROM \"User\") as users,
        (SELECT COUNT(*) FROM \"Provider\" WHERE \"isActive\" = true) as providers,
        (SELECT COUNT(*) FROM \"Offer\" WHERE \"isActive\" = true) as offers,
        (SELECT COUNT(*) FROM \"StoredInsight\") as insights,
        (SELECT COUNT(*) FROM \"DevelopmentRequest\") as dev_requests;
    "
    ;;

  help|*)
    echo "SMB Market Intel — Admin Tools"
    echo "==============================="
    echo ""
    echo "Usage: ./smb-admin.sh <command>"
    echo ""
    echo "Commands:"
    echo "  users      List all registered users"
    echo "  activity   Show user activity (refreshes & analyses)"
    echo "  signups    Signups by day"
    echo "  insights   AI analyses summary"
    echo "  requests   Development requests"
    echo "  data       Provider data status"
    echo "  stats      Quick overview of everything"
    echo "  help       Show this help"
    ;;
esac

