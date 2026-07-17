from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.activity_log import ActivityLog
from app.models.user import User

class AnalyticsService:
    @staticmethod
    def get_dashboard_analytics(db: Session) -> dict:
        # Count tasks by status
        total_tasks = db.query(Task).count()
        completed_tasks = db.query(Task).filter(Task.status == "completed").count()
        pending_tasks = db.query(Task).filter(Task.status == "pending").count()
        
        # User metrics
        total_users = db.query(User).count()
        
        # Aggregate activities
        activity_stats = db.query(
            ActivityLog.action,
            func.count(ActivityLog.id)
        ).group_by(ActivityLog.action).all()
        
        breakdown = {item[0]: item[1] for item in activity_stats}
        
        # Extract and count search query keywords
        search_logs = db.query(ActivityLog.details).filter(ActivityLog.action == "search").all()
        query_map = {}
        for log in search_logs:
            text = log[0] or ""
            prefix = "User searched for query: '"
            if prefix in text:
                # Extract original search term
                term = text.split(prefix)[1].rstrip("'")
                if term.strip():
                    query_map[term] = query_map.get(term, 0) + 1
            else:
                if text.strip():
                    query_map[text] = query_map.get(text, 0) + 1
                    
        # Sort and limit to top 5 queries
        sorted_queries = sorted(query_map.items(), key=lambda x: x[1], reverse=True)[:5]
        top_queries = [{"query": item[0], "count": item[1]} for item in sorted_queries]
        
        # Fetch last 15 audit logs
        logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(15).all()
        recent_logs = []
        for l in logs:
            user = db.query(User).filter(User.id == l.user_id).first() if l.user_id else None
            recent_logs.append({
                "id": l.id,
                "username": user.username if user else "System/Guest",
                "action": l.action,
                "details": l.details,
                "created_at": l.created_at
            })
            
        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "total_users": total_users,
            "activity_breakdown": breakdown,
            "top_queries": top_queries,
            "recent_logs": recent_logs
        }

analytics_service = AnalyticsService()
